import { useEffect, useState } from "react";
import "./App.css";

type Material = {
  id: number;
  name: string;
  category: string;
  manufacturer: string;
  unit: string;
  unitCost: number;
  width: number | null;
  depth: number | null;
  height: number | null;
  imageUrl: string | null;
};

type Category = {
  id: number;
  name: string;
};

type MaterialForm = {
  name: string;
  category: string;
  manufacturer: string;
  unit: string;
  unitCost: string;
  width: string;
  depth: string;
  height: string;
};

type UnitSystem = "metric" | "imperial";

const API_URL = "/api";

// Units cladding and surface materials are priced in: area, linear metre/foot
// (boards, trims), sheet or panel, box of tiles, or individual piece
const UNITS: Record<UnitSystem, string[]> = {
  metric: ["m²", "m", "sheet", "box", "each"],
  imperial: ["ft²", "ft", "sheet", "box", "each"],
};

const UNIT_SYSTEMS = [
  { value: "metric", label: "METRIC" },
  { value: "imperial", label: "IMPERIAL" },
] as const;

const UNIT_SYSTEM_KEY = "unitSystem";

// The API always stores metric. Imperial is converted for display and
// converted back on save.
const MM_PER_INCH = 25.4;

// Priced units that have an imperial counterpart, with how many metric units
// one imperial unit is. Counted units (sheet, box, each) need no conversion.
const UNIT_CONVERSIONS = [
  { metric: "m²", imperial: "ft²", factor: 0.09290304 },
  { metric: "m", imperial: "ft", factor: 0.3048 },
];

const LENGTH_UNITS = {
  metric: { symbol: "mm", name: "millimetres" },
  imperial: { symbol: "in", name: "inches" },
};

// Must match the API's limit on dimensions, in millimetres
const MAX_DIMENSION = 100000;

const round = (value: number, places: number) => Number(value.toFixed(places));

// Stored millimetres shown in the chosen system
const displayLength = (mm: number, system: UnitSystem) =>
  system === "imperial" ? round(mm / MM_PER_INCH, 2) : mm;

// A length typed in the chosen system, converted to millimetres
const storedLength = (value: number, system: UnitSystem) =>
  system === "imperial" ? round(value * MM_PER_INCH, 2) : value;

// Stored unit and cost shown in the chosen system, e.g. $48.50 / m² as $4.51 / ft²
const displayPrice = (
  material: Pick<Material, "unit" | "unitCost">,
  system: UnitSystem
) => {
  const conversion = UNIT_CONVERSIONS.find(({ metric }) => metric === material.unit);

  return system === "imperial" && conversion
    ? { unit: conversion.imperial, unitCost: material.unitCost * conversion.factor }
    : { unit: material.unit, unitCost: material.unitCost };
};

// An imperial unit and cost typed in the form, converted to what the API stores
const storedPrice = (unit: string, unitCost: number) => {
  const conversion = UNIT_CONVERSIONS.find(({ imperial }) => imperial === unit);

  return conversion
    ? { unit: conversion.metric, unitCost: round(unitCost / conversion.factor, 4) }
    : { unit, unitCost };
};

// Local storage can be unavailable (private windows, blocked site data)
const loadUnitSystem = (): UnitSystem => {
  try {
    return localStorage.getItem(UNIT_SYSTEM_KEY) === "imperial" ? "imperial" : "metric";
  } catch {
    return "metric";
  }
};

const saveUnitSystem = (system: UnitSystem) => {
  try {
    localStorage.setItem(UNIT_SYSTEM_KEY, system);
  } catch {
    // The choice just won't be remembered
  }
};

// Must match the limits enforced by the API
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Size inputs, all optional and stored in millimetres
const DIMENSIONS = [
  { name: "width", letter: "W", label: "Width" },
  { name: "depth", letter: "D", label: "Depth" },
  { name: "height", letter: "H", label: "Height" },
] as const;

type DimensionName = (typeof DIMENSIONS)[number]["name"];

// "W600 × D10 × H600 mm" (or inches), skipping any dimension that was left empty
const formatSize = (material: Material, system: UnitSystem) => {
  const parts = DIMENSIONS.flatMap(({ name, letter }) => {
    const value = material[name];

    return value === null ? [] : [`${letter}${displayLength(value, system)}`];
  });

  return parts.length > 0
    ? `${parts.join(" × ")} ${LENGTH_UNITS[system].symbol}`
    : null;
};

// Empty input means "not specified"
const toOptionalNumber = (value: string) =>
  value.trim() === "" ? null : Number(value);

// Form fields for an existing material, in the chosen system
const toForm = (
  material: Omit<Material, "id" | "imageUrl">,
  system: UnitSystem
): MaterialForm => {
  const price = displayPrice(material, system);

  const length = (mm: number | null) =>
    mm === null ? "" : displayLength(mm, system).toString();

  return {
    name: material.name,
    category: material.category,
    manufacturer: material.manufacturer,
    unit: price.unit,
    unitCost: round(price.unitCost, 2).toString(),
    width: length(material.width),
    depth: length(material.depth),
    height: length(material.height),
  };
};

// Unit, cost and size from the form, in the metric values the API stores.
// Fields left as they were opened keep their stored value, so editing a
// material in imperial doesn't drift its other numbers through rounding.
const toStoredValues = (
  form: MaterialForm,
  system: UnitSystem,
  original: Material | null
) => {
  const opened = original && toForm(original, system);

  const price =
    original &&
    opened &&
    form.unit === opened.unit &&
    form.unitCost === opened.unitCost
      ? { unit: original.unit, unitCost: original.unitCost }
      : storedPrice(form.unit, Number(form.unitCost));

  const length = (name: DimensionName) => {
    if (original && opened && form[name] === opened[name]) {
      return original[name];
    }

    const value = toOptionalNumber(form[name]);
    return value === null ? null : storedLength(value, system);
  };

  return {
    unit: price.unit,
    unitCost: price.unitCost,
    width: length("width"),
    depth: length("depth"),
    height: length("height"),
  };
};

// Re-express what has been typed in the form in another unit system
const convertForm = (
  form: MaterialForm,
  from: UnitSystem,
  to: UnitSystem,
  original: Material | null
): MaterialForm => {
  const converted = toForm(
    { ...form, ...toStoredValues(form, from, original) },
    to
  );

  // A cost that hasn't been entered yet stays empty rather than becoming 0
  return form.unitCost.trim() === ""
    ? { ...converted, unitCost: "" }
    : converted;
};

// Image URLs from the API are relative to the API, so route them through the proxy
const imageSrc = (imageUrl: string) => `${API_URL}${imageUrl}`;

const API_OFFLINE = "CANNOT REACH THE API. IS MaterialCatalog.Api RUNNING?";

// Turn a failed response into a readable message, using the API's validation
// errors when there are any. The Vite proxy answers 502 when the API is down.
const responseError = async (response: Response, fallback: string) => {
  if (response.status >= 500) {
    return API_OFFLINE;
  }

  try {
    const problem = await response.json();
    const messages = Object.values(problem.errors ?? {}).flat();

    if (messages.length > 0) {
      return messages.join(" ");
    }
  } catch {
    // Body was not JSON, use the fallback
  }

  return fallback;
};

// fetch() itself throws a TypeError when the server cannot be reached at all
const errorMessage = (error: unknown) =>
  error instanceof TypeError ? API_OFFLINE : (error as Error).message;

const EMPTY_FORM: MaterialForm = {
  name: "",
  category: "",
  manufacturer: "",
  unit: "",
  unitCost: "",
  width: "",
  depth: "",
  height: "",
};

function App() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [unitSystem, setUnitSystem] = useState<UnitSystem>(loadUnitSystem);

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // -------------------------
  // GET MATERIALS
  // -------------------------
  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_URL}/materials`);

      if (!response.ok) {
        throw new Error(await responseError(response, "FAILED TO LOAD MATERIALS"));
      }

      const data: Material[] = await response.json();
      setMaterials(data);
      setApiError(null);
    } catch (error) {
      console.error(error);
      setApiError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // GET CATEGORIES
  // -------------------------
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);

      if (!response.ok) {
        throw new Error(await responseError(response, "FAILED TO LOAD CATEGORIES"));
      }

      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
      setApiError(errorMessage(error));
    }
  };

  const loadData = () => {
    fetchMaterials();
    fetchCategories();
  };

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, []);

  // -------------------------
  // FORM
  // -------------------------
  // Swap the preview, releasing any local blob URL from a previously chosen file
  const replacePreview = (url: string | null) => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(url);
  };

  const resetImage = (imageUrl: string | null) => {
    setImageFile(null);
    setImageError(null);
    replacePreview(imageUrl ? imageSrc(imageUrl) : null);
  };

  const openForm = () => {
    // Categories may have failed to load earlier (e.g. the API started after the page)
    if (categories.length === 0) {
      fetchCategories();
    }

    setFormError(null);
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingMaterial(null);
    setForm(EMPTY_FORM);
    resetImage(null);
    openForm();
  };

  const openEditForm = (material: Material) => {
    setEditingMaterial(material);
    setForm(toForm(material, unitSystem));
    resetImage(material.imageUrl);
    openForm();
  };

  // Switched from inside the form, so convert what has been typed so far.
  // The choice also sets how the table shows sizes and prices.
  const changeUnitSystem = (system: UnitSystem) => {
    if (system === unitSystem) return;

    setForm(convertForm(form, unitSystem, system, editingMaterial));
    setUnitSystem(system);
    saveUnitSystem(system);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMaterial(null);
    resetImage(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Clear the input so choosing the same file again still fires onChange
    e.target.value = "";

    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError("IMAGE MUST BE JPEG, PNG, WEBP OR GIF");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("IMAGE MUST BE 5 MB OR SMALLER");
      return;
    }

    setImageError(null);
    setImageFile(file);
    replacePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImageError(null);
    replacePreview(null);
  };

  // -------------------------
  // CREATE / UPDATE
  // -------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      // Find the category object based on the selected category name
      const selectedCategory = categories.find(
        (category) => category.name === form.category
      );

      if (!selectedCategory) {
        throw new Error("PLEASE SELECT A CATEGORY");
      }

      const url = editingMaterial
        ? `${API_URL}/materials/${editingMaterial.id}`
        : `${API_URL}/materials`;

      const method = editingMaterial ? "PUT" : "POST";

      // Payload expected by the API
      const payload = {
        name: form.name,
        categoryId: selectedCategory.id,
        manufacturer: form.manufacturer,
        ...toStoredValues(form, unitSystem, editingMaterial),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await responseError(response, "FAILED TO SAVE MATERIAL"));
      }

      // POST returns the created material, PUT returns no content
      const materialId: number = editingMaterial
        ? editingMaterial.id
        : (await response.json()).id;

      if (!editingMaterial) {
        // From here on the material exists, so a retry after an image error
        // must update it rather than create a duplicate
        setEditingMaterial({
          id: materialId,
          name: form.name,
          category: form.category,
          manufacturer: form.manufacturer,
          unit: payload.unit,
          unitCost: payload.unitCost,
          width: payload.width,
          depth: payload.depth,
          height: payload.height,
          imageUrl: null,
        });
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const imageResponse = await fetch(
          `${API_URL}/materials/${materialId}/image`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!imageResponse.ok) {
          throw new Error(
            "MATERIAL SAVED, BUT THE IMAGE FAILED: " +
              (await responseError(imageResponse, "UPLOAD FAILED"))
          );
        }
      } else if (editingMaterial?.imageUrl && !imagePreview) {
        const imageResponse = await fetch(
          `${API_URL}/materials/${materialId}/image`,
          {
            method: "DELETE",
          }
        );

        if (!imageResponse.ok) {
          throw new Error(
            "MATERIAL SAVED, BUT THE IMAGE WAS NOT REMOVED: " +
              (await responseError(imageResponse, "REMOVE FAILED"))
          );
        }
      }

      closeForm();
      await fetchMaterials();
    } catch (error) {
      console.error(error);
      setFormError(errorMessage(error));
      await fetchMaterials();
    }
  };

  // -------------------------
  // DELETE
  // -------------------------
  const deleteMaterial = (material: Material) => {
    setDeleteError(null);
    setMaterialToDelete(material);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/materials/${materialToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(await responseError(response, "FAILED TO DELETE MATERIAL"));
      }

      setMaterialToDelete(null);
      await fetchMaterials();
    } catch (error) {
      console.error(error);
      setDeleteError(errorMessage(error));
    }
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div>
          <h1>MATERIAL CATALOG</h1>
          <p>CLADDING & SURFACE MATERIALS v1.0</p>
        </div>

        <div className="title-block">
          <div>
            <small>DWG NO.</small>
            MC-001
          </div>

          <div>
            <small>REV</small>
            A
          </div>

          <div>
            <small>STATUS</small>
            <span className={apiError ? "status status-offline" : "status"}>
              <span className="status-dot" />
              {apiError ? "OFFLINE" : "ONLINE"}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container">
        <div className="page-title">
          <div>
            <h2>MATERIAL LIBRARY</h2>
            <p>{materials.length} MATERIALS REGISTERED</p>
          </div>

          <button className="btn btn-primary" onClick={openCreateForm}>
            + NEW MATERIAL
          </button>
        </div>

        {apiError && (
          <div className="alert" role="alert">
            <span>{apiError}</span>

            <button className="btn btn-edit" onClick={loadData}>
              RETRY
            </button>
          </div>
        )}

        {/* TABLE */}
        <section className="table-panel">
          {loading ? (
            <div className="loading">LOADING MATERIALS...</div>
          ) : apiError && materials.length === 0 ? (
            <div className="empty">
              <p>MATERIALS COULD NOT BE LOADED</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="empty">
              <p>NO MATERIALS FOUND</p>

              <button className="btn btn-primary" onClick={openCreateForm}>
                + ADD FIRST MATERIAL
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>IMAGE</th>
                  <th>MATERIAL</th>
                  <th>CATEGORY</th>
                  <th>MANUFACTURER</th>
                  <th>SIZE</th>
                  <th>UNIT COST</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {materials.map((material) => {
                  const size = formatSize(material, unitSystem);
                  const price = displayPrice(material, unitSystem);

                  return (
                    <tr key={material.id}>
                      <td className="id">#{material.id}</td>

                      <td>
                        {material.imageUrl ? (
                          <img
                            className="thumb"
                            src={imageSrc(material.imageUrl)}
                            alt={material.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="thumb thumb-empty" aria-label="No image" />
                        )}
                      </td>

                      <td className="material-name">{material.name}</td>

                      <td>
                        <span className="category">
                          {material.category}
                        </span>
                      </td>

                      <td>{material.manufacturer}</td>

                      <td className={size ? "size" : "size empty-value"}>
                        {size ?? "—"}
                      </td>

                      <td className="price">
                        ${price.unitCost.toFixed(2)} / {price.unit}
                      </td>

                      <td>
                        <div className="actions">
                          <button
                            className="btn btn-edit"
                            onClick={() => openEditForm(material)}
                          >
                            EDIT
                          </button>

                          <button
                            className="btn btn-delete"
                            onClick={() => deleteMaterial(material)}
                          >
                            DELETE
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingMaterial ? "EDIT MATERIAL" : "NEW MATERIAL"}
                </h2>

                <p>
                  {editingMaterial
                    ? `EDITING MATERIAL #${editingMaterial.id}`
                    : "ADD MATERIAL TO CATALOG"}
                </p>
              </div>

              <button className="close" onClick={closeForm}>
                X
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>MATERIAL NAME</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Glazed Porcelain Tile"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CATEGORY</label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      {categories.length === 0
                        ? "NO CATEGORIES LOADED"
                        : "SELECT CATEGORY"}
                    </option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>MANUFACTURER</label>

                  <input
                    type="text"
                    name="manufacturer"
                    value={form.manufacturer}
                    onChange={handleChange}
                    placeholder="Enter manufacturer"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label id="unit-system-label">UNIT SYSTEM</label>

                <div
                  className="unit-toggle"
                  role="group"
                  aria-labelledby="unit-system-label"
                >
                  {UNIT_SYSTEMS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={unitSystem === value}
                      onClick={() => changeUnitSystem(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>UNIT</label>

                  <input
                    type="text"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    list="unit-options"
                    placeholder={`${UNITS[unitSystem].slice(0, 3).join(", ")}...`}
                    maxLength={20}
                    required
                  />

                  <datalist id="unit-options">
                    {UNITS[unitSystem].map((unit) => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>UNIT COST ($)</label>

                  <input
                    type="number"
                    name="unitCost"
                    value={form.unitCost}
                    onChange={handleChange}
                    min="0"
                    max="1000000"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <fieldset className="form-group size-group">
                <legend>
                  SIZE ({LENGTH_UNITS[unitSystem].symbol}){" "}
                  <span className="optional">OPTIONAL</span>
                </legend>

                <div className="size-inputs">
                  {DIMENSIONS.map(({ name, letter, label }) => (
                    <label key={name} className="dimension" title={label}>
                      <span aria-hidden="true">{letter}</span>

                      <input
                        type="number"
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        aria-label={`${label} in ${LENGTH_UNITS[unitSystem].name}`}
                        min="0"
                        max={displayLength(MAX_DIMENSION, unitSystem)}
                        step="any"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="form-group">
                <label>EXAMPLE PICTURE</label>

                <div className="image-field">
                  <div className="image-preview">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Example picture preview" />
                    ) : (
                      <span>NO IMAGE</span>
                    )}
                  </div>

                  <div className="image-controls">
                    <div className="image-buttons">
                      <label className="btn btn-edit file-button">
                        {imagePreview ? "REPLACE" : "CHOOSE FILE"}

                        <input
                          type="file"
                          accept={IMAGE_TYPES.join(",")}
                          onChange={handleImageChange}
                        />
                      </label>

                      {imagePreview && (
                        <button
                          type="button"
                          className="btn btn-delete"
                          onClick={removeImage}
                        >
                          REMOVE
                        </button>
                      )}
                    </div>

                    <small>JPEG, PNG, WEBP OR GIF · MAX 5 MB</small>

                    {imageError && (
                      <p className="field-error">{imageError}</p>
                    )}
                  </div>
                </div>
              </div>

              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={closeForm}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingMaterial ? "UPDATE MATERIAL" : "CREATE MATERIAL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {materialToDelete && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <div>
                <h2>DELETE MATERIAL</h2>
                <p>CONFIRM DELETION</p>
              </div>

              <button
                className="close"
                onClick={() => setMaterialToDelete(null)}
              >
                X
              </button>
            </div>

            <div className="delete-content">
              <p>
                ARE YOU SURE YOU WANT TO DELETE:
              </p>

              <h3>
                "{materialToDelete.name}"
              </h3>

              <p className="warning">
                THIS ACTION CANNOT BE UNDONE.
              </p>

              {deleteError && (
                <p className="form-error" role="alert">
                  {deleteError}
                </p>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={() => setMaterialToDelete(null)}
              >
                CANCEL
              </button>

              <button
                type="button"
                className="btn btn-delete"
                onClick={confirmDelete}
              >
                DELETE MATERIAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

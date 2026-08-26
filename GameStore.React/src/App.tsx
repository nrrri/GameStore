import { useEffect, useState } from "react";
import "./App.css";

type Game = {
  id: number;
  name: string;
  genre: string;
  price: number;
  releaseDate: string;
};

type Genre = {
  id: number;
  name: string;
};

type GameForm = {
  name: string;
  genre: string;
  price: string;
  releaseDate: string;
};

const API_URL = "/api";

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  const [form, setForm] = useState<GameForm>({
    name: "",
    genre: "",
    price: "",
    releaseDate: "",
  });

  const [loading, setLoading] = useState(true);

  // -------------------------
  // GET GAMES
  // -------------------------
  const fetchGames = async () => {
    try {
      const response = await fetch(`${API_URL}/games`);

      if (!response.ok) {
        throw new Error("Failed to fetch games");
      }

      const data: Game[] = await response.json();
      setGames(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // GET GENRES
  // -------------------------
  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_URL}/genres`);

      if (!response.ok) {
        throw new Error("Failed to fetch genres");
      }

      const data: Genre[] = await response.json();
      setGenres(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchGames();
    fetchGenres();
  }, []);

  // -------------------------
  // FORM
  // -------------------------
  const openCreateForm = () => {
    setEditingGame(null);

    setForm({
      name: "",
      genre: "",
      price: "",
      releaseDate: "",
    });

    setShowForm(true);
  };

  const openEditForm = (game: Game) => {
    setEditingGame(game);

    setForm({
      name: game.name,
      genre: game.genre,
      price: game.price.toString(),
      releaseDate: game.releaseDate,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGame(null);
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

  // -------------------------
  // CREATE / UPDATE
  // -------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Find the genre object based on the selected genre name
      const selectedGenre = genres.find(
        (genre) => genre.name === form.genre
      );

      if (!selectedGenre) {
        throw new Error(`Genre "${form.genre}" not found`);
      }

      const url = editingGame
        ? `${API_URL}/games/${editingGame.id}`
        : `${API_URL}/games`;

      const method = editingGame ? "PUT" : "POST";

      // Payload expected by the API
      const payload = {
        name: form.name,
        genreId: selectedGenre.id,
        price: Number(form.price),
        releaseDate: form.releaseDate,
      };

      console.log("Payload:", payload);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save game");
      }

      closeForm();
      await fetchGames();
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------
  // DELETE
  // -------------------------
  const deleteGame = (game: Game) => {
    setGameToDelete(game);
  };

  const confirmDelete = async () => {
    if (!gameToDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/games/${gameToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete game");
      }

      setGameToDelete(null);
      await fetchGames();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div>
          <h1>GAMESTORE</h1>
          <p>GAMES DATABASE v1.0</p>
        </div>

        <div className="header-status">
          <span className="status-dot" />
          SYSTEM ONLINE
        </div>
      </header>

      {/* MAIN */}
      <main className="container">
        <div className="page-title">
          <div>
            <h2>GAME INVENTORY</h2>
            <p>{games.length} GAMES REGISTERED</p>
          </div>

          <button className="btn btn-primary" onClick={openCreateForm}>
            + NEW GAME
          </button>
        </div>

        {/* TABLE */}
        <section className="table-panel">
          {loading ? (
            <div className="loading">LOADING GAMES...</div>
          ) : games.length === 0 ? (
            <div className="empty">
              <p>NO GAMES FOUND</p>

              <button className="btn btn-primary" onClick={openCreateForm}>
                + ADD FIRST GAME
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>GAME NAME</th>
                  <th>GENRE</th>
                  <th>PRICE</th>
                  <th>RELEASE DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {games.map((game) => (
                  <tr key={game.id}>
                    <td className="id">#{game.id}</td>

                    <td className="game-name">{game.name}</td>

                    <td>
                      <span className="genre">
                        {game.genre}
                      </span>
                    </td>

                    <td className="price">
                      ${game.price.toFixed(2)}
                    </td>

                    <td>{game.releaseDate}</td>

                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-edit"
                          onClick={() => openEditForm(game)}
                        >
                          EDIT
                        </button>

                        <button
                          className="btn btn-delete"
                          onClick={() => deleteGame(game)}
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  {editingGame ? "EDIT GAME" : "NEW GAME"}
                </h2>

                <p>
                  {editingGame
                    ? `EDITING GAME #${editingGame.id}`
                    : "ADD GAME TO DATABASE"}
                </p>
              </div>

              <button className="close" onClick={closeForm}>
                X
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>GAME NAME</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter game name"
                  required
                />
              </div>

              <div className="form-group">
                <label>GENRE</label>

                <select
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  required
                >
                  <option value="">SELECT GENRE</option>

                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.name}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>PRICE</label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>RELEASE DATE</label>

                  <input
                    type="date"
                    name="releaseDate"
                    value={form.releaseDate}
                    onChange={handleChange}
                    required
                    min="1900-01-01"
                    max="2099-12-31"
                  />
                </div>
              </div>

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
                  {editingGame ? "UPDATE GAME" : "CREATE GAME"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {gameToDelete && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <div>
                <h2>DELETE GAME</h2>
                <p>CONFIRM DELETION</p>
              </div>

              <button
                className="close"
                onClick={() => setGameToDelete(null)}
              >
                X
              </button>
            </div>

            <div className="delete-content">
              <p>
                ARE YOU SURE YOU WANT TO DELETE:
              </p>

              <h3>
                "{gameToDelete.name}"
              </h3>

              <p className="warning">
                THIS ACTION CANNOT BE UNDONE.
              </p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={() => setGameToDelete(null)}
              >
                CANCEL
              </button>

              <button
                type="button"
                className="btn btn-delete"
                onClick={confirmDelete}
              >
                DELETE GAME
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
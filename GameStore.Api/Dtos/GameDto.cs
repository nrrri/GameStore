namespace GameStore.Api.Dtos;

// A DTO is a contract between the client and server since it represents
// shared agreement about how data will be transferred and used
public record class GameDto
(
    int Id,
    string Name,
    string Genre,
    decimal Price,
    DateOnly ReleaseDate
);
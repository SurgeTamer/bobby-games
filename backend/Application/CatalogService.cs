using BobbyGames.Core;

namespace BobbyGames.Application;

public sealed class CatalogService(IAppStore store)
{
    public IReadOnlyList<GameDto> GetGames(string? query, string? category, string? tag)
    {
        var games = store.Games.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(query)) games = games.Where(x => x.Title.Contains(query, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(category)) games = games.Where(x => x.Cats.Contains(category));
        if (!string.IsNullOrWhiteSpace(tag)) games = games.Where(x => x.Tag.Equals(tag, StringComparison.OrdinalIgnoreCase));
        return games.OrderBy(x => x.Title).Select(x => x.ToDto()).ToArray();
    }

    public GameDto GetGame(string id) => FindGame(id).ToDto();

    public async Task<GameDto> CreateGameAsync(SaveGameRequest request, CancellationToken cancellationToken)
    {
        Validate(request);
        if (store.Games.Any(x => x.Id == request.Id)) throw new ConflictException("Игра уже существует");
        var game = ToEntity(request);
        store.Add(game);
        await store.SaveChangesAsync(cancellationToken);
        return game.ToDto();
    }

    public async Task<GameDto> UpdateGameAsync(string id, SaveGameRequest request, CancellationToken cancellationToken)
    {
        Validate(request);
        var game = FindGame(id);
        game.Title = request.Title.Trim();
        game.Cats = request.Cats.Distinct().ToArray();
        game.Tag = request.Tag.Trim();
        game.Meta = request.Meta.Trim();
        game.Price = request.Price;
        game.Media = request.Media.Trim();
        game.IsFeatured = request.IsFeatured;
        await store.SaveChangesAsync(cancellationToken);
        return game.ToDto();
    }

    public async Task DeleteGameAsync(string id, CancellationToken cancellationToken)
    {
        store.Remove(FindGame(id));
        await store.SaveChangesAsync(cancellationToken);
    }

    public IReadOnlyList<CategoryDto> GetCategories() => store.Categories.OrderBy(x => x.Title).Select(x => x.ToDto()).ToArray();

    public async Task<CategoryDto> CreateCategoryAsync(SaveCategoryRequest request, CancellationToken cancellationToken)
    {
        Validate(request);
        if (store.Categories.Any(x => x.Id == request.Id)) throw new ConflictException("Категория уже существует");
        var category = new Category { Id = request.Id.Trim(), Title = request.Title.Trim() };
        store.Add(category);
        await store.SaveChangesAsync(cancellationToken);
        return category.ToDto();
    }

    public async Task<CategoryDto> UpdateCategoryAsync(string id, SaveCategoryRequest request, CancellationToken cancellationToken)
    {
        Validate(request);
        var category = FindCategory(id);
        category.Title = request.Title.Trim();
        await store.SaveChangesAsync(cancellationToken);
        return category.ToDto();
    }

    public async Task DeleteCategoryAsync(string id, CancellationToken cancellationToken)
    {
        var category = FindCategory(id);
        if (store.Games.Any(x => x.Cats.Contains(id))) throw new ConflictException("Категория используется в каталоге");
        store.Remove(category);
        await store.SaveChangesAsync(cancellationToken);
    }

    private Game FindGame(string id) => store.Games.SingleOrDefault(x => x.Id == id) ?? throw new NotFoundException("Игра не найдена");
    private Category FindCategory(string id) => store.Categories.SingleOrDefault(x => x.Id == id) ?? throw new NotFoundException("Категория не найдена");

    private void Validate(SaveGameRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Id) || string.IsNullOrWhiteSpace(request.Title) || request.Price <= 0)
            throw new ValidationException("Проверьте id, название и цену игры");
        if (request.Cats.Length == 0 || request.Cats.Any(id => !store.Categories.Any(x => x.Id == id)))
            throw new ValidationException("Укажите существующие категории");
    }

    private static void Validate(SaveCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Id) || string.IsNullOrWhiteSpace(request.Title))
            throw new ValidationException("Id и название обязательны");
    }

    private static Game ToEntity(SaveGameRequest request) => new()
    {
        Id = request.Id.Trim(), Title = request.Title.Trim(), Cats = request.Cats.Distinct().ToArray(),
        Tag = request.Tag.Trim(), Meta = request.Meta.Trim(), Price = request.Price,
        Media = request.Media.Trim(), IsFeatured = request.IsFeatured
    };
}

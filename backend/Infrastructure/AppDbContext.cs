using BobbyGames.Application;
using BobbyGames.Core;
using Microsoft.EntityFrameworkCore;

namespace BobbyGames.Infrastructure;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppStore
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();

    IQueryable<User> IAppStore.Users => Users;
    IQueryable<Game> IAppStore.Games => Games;
    IQueryable<Category> IAppStore.Categories => Categories;
    IQueryable<CartItem> IAppStore.CartItems => CartItems;
    IQueryable<Order> IAppStore.Orders => Orders;
    void IAppStore.Add<T>(T entity) => Add(entity);
    void IAppStore.Remove<T>(T entity) => Remove(entity);
    async Task IAppStore.SaveChangesAsync(CancellationToken cancellationToken) =>
        _ = await SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<User>().HasIndex(x => x.Email).IsUnique();
        model.Entity<User>().Property(x => x.Role).HasConversion<string>();
        model.Entity<Game>().Property(x => x.Cats).HasColumnType("text[]");
        model.Entity<Game>().Property(x => x.Price).HasPrecision(12, 2);
        model.Entity<CartItem>().HasIndex(x => new { x.UserId, x.GameId }).IsUnique();
        model.Entity<CartItem>().Navigation(x => x.Game).AutoInclude();
        model.Entity<Order>().Property(x => x.Status).HasConversion<string>();
        model.Entity<Order>().Navigation(x => x.Items).AutoInclude();
    }
}

public static class SeedData
{
    public static async Task RunAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        if (!await db.Categories.AnyAsync())
            db.Categories.AddRange(new Category { Id = "company", Title = "для компании" }, new Category { Id = "duo", Title = "на двоих" }, new Category { Id = "kids", Title = "детские" }, new Category { Id = "strategy", Title = "стратегии" }, new Category { Id = "party", Title = "пати-игры" }, new Category { Id = "expand", Title = "дополнения" });
        var games = Games();
        var existingGameIds = await db.Games.Select(x => x.Id).ToListAsync();
        db.Games.AddRange(games.Where(x => !existingGameIds.Contains(x.Id)));
        foreach (var game in await db.Games.Where(x => x.IsFeatured).ToListAsync()) game.IsFeatured = false;
        var featured = db.Games.Local.SingleOrDefault(x => x.Id == "hnefatafl")
            ?? await db.Games.SingleAsync(x => x.Id == "hnefatafl");
        featured.IsFeatured = true;
        if (!await db.Users.AnyAsync(x => x.Role == UserRole.Admin))
        {
            var user = new User { Name = "Админ Bobby", Email = "admin@bobby.games", PasswordHash = "", Role = UserRole.Admin };
            user.PasswordHash = scope.ServiceProvider.GetRequiredService<IPasswordService>().Hash(user, "admin123");
            db.Users.Add(user);
        }
        await db.SaveChangesAsync();
    }

    private static Game[] Games() =>
    [
        New("hnefatafl", "Хнефатафл", ["duo", "strategy"], "хит", "2 игрока · 30 мин · 8+", 6490, "peri", true),
        New("gwent", "Гвинт", ["duo", "strategy"], "хит", "2 игрока · 30 мин · 12+", 3490, "cream"),
        New("card-wars", "Карточные войны", ["duo", "kids"], "пати", "Время приключений · 2 игрока · 30 мин · 8+", 2590, "acid"),
        New("carcassonne", "Каркассон", ["company"], "новинка", "2–5 игроков · 45 мин · 7+", 2490, "peri"),
        New("codenames", "Кодовые имена", ["company", "party"], "хит", "4–8 игроков · 15 мин · 10+", 1690, "acid"),
        New("arkham", "Ужас Аркхэма", ["strategy"], "предзаказ", "1–4 игрока · 180 мин · 14+", 7990, "cream"),
        New("patchwork", "Пэчворк", ["duo"], "на двоих", "2 игрока · 30 мин · 8+", 2190, "peri"),
        New("dobble", "Доббль", ["kids", "party"], "детские", "2–8 игроков · 15 мин · 6+", 1290, "acid"),
        New("ticket", "Билет на поезд", ["company", "kids"], "семья", "2–5 игроков · 60 мин · 8+", 4490, "cream"),
        New("munchkin", "Манчкин", ["company", "party"], "пати", "3–6 игроков · 90 мин · 10+", 1990, "peri"),
        New("wingspan", "Крылья", ["strategy", "duo"], "евро", "1–5 игроков · 70 мин · 10+", 5490, "acid"),
        New("carcassonne-inns", "Каркассон. Таверны", ["expand", "company"], "дополнение", "2–5 игроков · 45 мин · 7+", 1890, "cream")
    ];

    private static Game New(string id, string title, string[] cats, string tag, string meta, decimal price, string media, bool featured = false) => new() { Id = id, Title = title, Cats = cats, Tag = tag, Meta = meta, Price = price, Media = media, IsFeatured = featured };
}

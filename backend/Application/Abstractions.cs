using BobbyGames.Core;

namespace BobbyGames.Application;

public interface IAppStore
{
    IQueryable<User> Users { get; }
    IQueryable<Game> Games { get; }
    IQueryable<Category> Categories { get; }
    IQueryable<CartItem> CartItems { get; }
    IQueryable<Order> Orders { get; }
    void Add<T>(T entity) where T : class;
    void Remove<T>(T entity) where T : class;
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IPasswordService
{
    string Hash(User user, string password);
    bool Verify(User user, string password);
}

public interface ITokenService
{
    string Create(User user);
}

namespace BobbyGames.Core;

public enum UserRole { Client, Admin }
public enum OrderStatus { Accepted, Assembling, Ready, Cancelled }

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; set; } = UserRole.Client;
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
}

public sealed class Category
{
    public required string Id { get; set; }
    public required string Title { get; set; }
}

public sealed class Game
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public required string Tag { get; set; }
    public required string Meta { get; set; }
    public decimal Price { get; set; }
    public required string Media { get; set; }
    public bool IsFeatured { get; set; }
    public string[] Cats { get; set; } = [];
}

public sealed class CartItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string GameId { get; set; }
    public Game Game { get; set; } = null!;
    public int Quantity { get; set; }
}

public sealed class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Accepted;
    public decimal Total { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}

public sealed class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public required string GameId { get; set; }
    public required string Title { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

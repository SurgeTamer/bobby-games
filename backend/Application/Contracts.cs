using BobbyGames.Core;

namespace BobbyGames.Application;

public sealed record RegisterRequest(string Name, string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResult(string AccessToken, UserDto User);
public sealed record UserDto(Guid Id, string Name, string Email, string Role, string Phone, string Address);
public sealed record UpdateUserRequest(string Name, string Phone, string Address);
public sealed record ChangeRoleRequest(string Role);

public sealed record SaveGameRequest(string Id, string Title, string[] Cats, string Tag, string Meta, decimal Price, string Media, bool IsFeatured);
public sealed record GameDto(string Id, string Title, string[] Cats, string Tag, string Meta, decimal Price, string Media, bool IsFeatured);
public sealed record SaveCategoryRequest(string Id, string Title);
public sealed record CategoryDto(string Id, string Title);

public sealed record AddCartItemRequest(string GameId, int Quantity = 1);
public sealed record ChangeQuantityRequest(int Quantity);
public sealed record CartLineDto(Guid Id, string GameId, string Title, decimal Price, int Quantity);
public sealed record CartDto(IReadOnlyList<CartLineDto> Items, decimal Total);

public sealed record ChangeStatusRequest(string Status);
public sealed record OrderLineDto(string GameId, string Title, decimal Price, int Quantity);
public sealed record OrderDto(Guid Id, Guid UserId, IReadOnlyList<OrderLineDto> Items, decimal Total, DateTimeOffset CreatedAt, string Status);

public static class DtoMappings
{
    public static UserDto ToDto(this User user) => new(user.Id, user.Name, user.Email, user.Role.ToString().ToLowerInvariant(), user.Phone, user.Address);
    public static GameDto ToDto(this Game game) => new(game.Id, game.Title, game.Cats, game.Tag, game.Meta, game.Price, game.Media, game.IsFeatured);
    public static CategoryDto ToDto(this Category category) => new(category.Id, category.Title);
    public static OrderDto ToDto(this Order order) => new(
        order.Id, order.UserId,
        order.Items.Select(x => new OrderLineDto(x.GameId, x.Title, x.Price, x.Quantity)).ToArray(),
        order.Total, order.CreatedAt,
        order.Status switch
        {
            OrderStatus.Accepted => "принят",
            OrderStatus.Assembling => "собираем",
            OrderStatus.Ready => "готов",
            _ => "отменён"
        });
}

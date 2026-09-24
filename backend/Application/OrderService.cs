using BobbyGames.Core;

namespace BobbyGames.Application;

public sealed class OrderService(IAppStore store)
{
    public IReadOnlyList<OrderDto> GetAll(Guid userId, bool isAdmin) => store.Orders
        .Where(x => isAdmin || x.UserId == userId)
        .OrderByDescending(x => x.CreatedAt)
        .AsEnumerable().Select(x => x.ToDto()).ToArray();

    public OrderDto Get(Guid userId, bool isAdmin, Guid orderId) => FindOrder(userId, isAdmin, orderId).ToDto();

    public async Task<OrderDto> CreateAsync(Guid userId, CancellationToken cancellationToken)
    {
        var cart = store.CartItems.Where(x => x.UserId == userId).ToArray();
        if (cart.Length == 0) throw new ValidationException("Корзина пустая");
        var order = new Order
        {
            UserId = userId,
            Items = cart.Select(x => new OrderItem
            {
                GameId = x.GameId, Title = x.Game.Title, Price = x.Game.Price, Quantity = x.Quantity
            }).ToList()
        };
        order.Total = order.Items.Sum(x => x.Price * x.Quantity);
        store.Add(order);
        foreach (var item in cart) store.Remove(item);
        await store.SaveChangesAsync(cancellationToken);
        return order.ToDto();
    }

    public async Task<OrderDto> ChangeStatusAsync(Guid orderId, string status, CancellationToken cancellationToken)
    {
        var order = store.Orders.SingleOrDefault(x => x.Id == orderId) ?? throw new NotFoundException("Заказ не найден");
        order.Status = ParseStatus(status);
        await store.SaveChangesAsync(cancellationToken);
        return order.ToDto();
    }

    public async Task CancelAsync(Guid userId, bool isAdmin, Guid orderId, CancellationToken cancellationToken)
    {
        var order = FindOrder(userId, isAdmin, orderId);
        if (!isAdmin && order.Status is OrderStatus.Ready or OrderStatus.Cancelled)
            throw new ConflictException("Заказ уже нельзя отменить");
        order.Status = OrderStatus.Cancelled;
        await store.SaveChangesAsync(cancellationToken);
    }

    private Order FindOrder(Guid userId, bool isAdmin, Guid id) => store.Orders.SingleOrDefault(x => x.Id == id && (isAdmin || x.UserId == userId))
        ?? throw new NotFoundException("Заказ не найден");

    private static OrderStatus ParseStatus(string value) => value.Trim().ToLowerInvariant() switch
    {
        "принят" or "accepted" => OrderStatus.Accepted,
        "собираем" or "assembling" => OrderStatus.Assembling,
        "готов" or "ready" => OrderStatus.Ready,
        "отменён" or "cancelled" => OrderStatus.Cancelled,
        _ => throw new ValidationException("Неизвестный статус")
    };
}

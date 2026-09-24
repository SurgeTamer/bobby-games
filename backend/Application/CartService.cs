using BobbyGames.Core;

namespace BobbyGames.Application;

public sealed class CartService(IAppStore store)
{
    public CartDto Get(Guid userId)
    {
        var items = store.CartItems.Where(x => x.UserId == userId).ToArray();
        var lines = items.Select(x => new CartLineDto(x.Id, x.GameId, x.Game.Title, x.Game.Price, x.Quantity)).ToArray();
        return new CartDto(lines, lines.Sum(x => x.Price * x.Quantity));
    }

    public async Task<CartDto> AddAsync(Guid userId, AddCartItemRequest request, CancellationToken cancellationToken)
    {
        ValidateQuantity(request.Quantity);
        if (!store.Games.Any(x => x.Id == request.GameId)) throw new NotFoundException("Игра не найдена");
        var item = store.CartItems.SingleOrDefault(x => x.UserId == userId && x.GameId == request.GameId);
        if (item is null) store.Add(new CartItem { UserId = userId, GameId = request.GameId, Quantity = request.Quantity });
        else item.Quantity += request.Quantity;
        await store.SaveChangesAsync(cancellationToken);
        return Get(userId);
    }

    public async Task<CartDto> UpdateAsync(Guid userId, Guid itemId, int quantity, CancellationToken cancellationToken)
    {
        ValidateQuantity(quantity);
        FindItem(userId, itemId).Quantity = quantity;
        await store.SaveChangesAsync(cancellationToken);
        return Get(userId);
    }

    public async Task<CartDto> DeleteAsync(Guid userId, Guid itemId, CancellationToken cancellationToken)
    {
        store.Remove(FindItem(userId, itemId));
        await store.SaveChangesAsync(cancellationToken);
        return Get(userId);
    }

    private CartItem FindItem(Guid userId, Guid id) => store.CartItems.SingleOrDefault(x => x.Id == id && x.UserId == userId)
        ?? throw new NotFoundException("Товар в корзине не найден");
    private static void ValidateQuantity(int quantity)
    {
        if (quantity < 1) throw new ValidationException("Количество должно быть больше нуля");
    }
}

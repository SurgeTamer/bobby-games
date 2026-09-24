using BobbyGames.Core;

namespace BobbyGames.Application;

public sealed class UserService(IAppStore store)
{
    public IReadOnlyList<UserDto> GetAll() => store.Users.OrderBy(x => x.Name).Select(x => x.ToDto()).ToArray();
    public UserDto Get(Guid id) => FindUser(id).ToDto();

    public async Task<UserDto> UpdateAsync(Guid actorId, bool isAdmin, Guid id, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        if (!isAdmin && actorId != id) throw new ForbiddenException("Нельзя менять чужой профиль");
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ValidationException("Укажите имя");
        var user = FindUser(id);
        user.Name = request.Name.Trim();
        user.Phone = request.Phone.Trim();
        user.Address = request.Address.Trim();
        await store.SaveChangesAsync(cancellationToken);
        return user.ToDto();
    }

    public async Task<UserDto> ChangeRoleAsync(Guid actorId, Guid id, string role, CancellationToken cancellationToken)
    {
        if (actorId == id) throw new ConflictException("Нельзя менять собственную роль");
        var user = FindUser(id);
        user.Role = role.Trim().ToLowerInvariant() switch
        {
            "admin" => UserRole.Admin,
            "client" => UserRole.Client,
            _ => throw new ValidationException("Неизвестная роль")
        };
        await store.SaveChangesAsync(cancellationToken);
        return user.ToDto();
    }

    public async Task DeleteAsync(Guid actorId, Guid id, CancellationToken cancellationToken)
    {
        if (actorId == id) throw new ConflictException("Нельзя удалить себя");
        store.Remove(FindUser(id));
        await store.SaveChangesAsync(cancellationToken);
    }

    private User FindUser(Guid id) => store.Users.SingleOrDefault(x => x.Id == id)
        ?? throw new NotFoundException("Пользователь не найден");
}

using BobbyGames.Core;

namespace BobbyGames.Application;

public sealed class AuthService(IAppStore store, IPasswordService passwords, ITokenService tokens)
{
    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(request.Name) || !email.Contains('@'))
            throw new ValidationException("Проверьте имя и email");
        if (request.Password.Length < 6)
            throw new ValidationException("Пароль — минимум 6 символов");
        if (store.Users.Any(x => x.Email == email))
            throw new ConflictException("Этот email уже зарегистрирован");

        var user = new User { Name = request.Name.Trim(), Email = email, PasswordHash = string.Empty };
        user.PasswordHash = passwords.Hash(user, request.Password);
        store.Add(user);
        await store.SaveChangesAsync(cancellationToken);
        return Result(user);
    }

    public AuthResult Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = store.Users.SingleOrDefault(x => x.Email == email);
        if (user is null || !passwords.Verify(user, request.Password))
            throw new ValidationException("Неверный email или пароль");
        return Result(user);
    }

    public UserDto GetCurrentUser(Guid userId) => FindUser(userId).ToDto();

    private AuthResult Result(User user) => new(tokens.Create(user), user.ToDto());
    private User FindUser(Guid id) => store.Users.SingleOrDefault(x => x.Id == id)
        ?? throw new NotFoundException("Пользователь не найден");
}

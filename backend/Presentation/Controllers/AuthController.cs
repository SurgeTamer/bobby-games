using BobbyGames.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BobbyGames.Presentation.Controllers;

[ApiController, Route("api/auth")]
public sealed class AuthController(AuthService service) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResult>> Register(RegisterRequest request, CancellationToken cancellationToken) =>
        StatusCode(StatusCodes.Status201Created, await service.RegisterAsync(request, cancellationToken));

    [HttpPost("login")]
    public ActionResult<AuthResult> Login(LoginRequest request) => Ok(service.Login(request));

    [Authorize, HttpGet("me")]
    public ActionResult<UserDto> Me() => Ok(service.GetCurrentUser(User.UserId()));
}

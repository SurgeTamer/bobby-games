using BobbyGames.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BobbyGames.Presentation.Controllers;

[ApiController, Authorize, Route("api/users")]
public sealed class UsersController(UserService service) : ControllerBase
{
    [Authorize(Roles = "admin"), HttpGet]
    public ActionResult<IReadOnlyList<UserDto>> GetAll() => Ok(service.GetAll());

    [Authorize(Roles = "admin"), HttpGet("{id:guid}")]
    public ActionResult<UserDto> Get(Guid id) => Ok(service.Get(id));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, UpdateUserRequest request, CancellationToken cancellationToken) =>
        Ok(await service.UpdateAsync(User.UserId(), User.IsAdmin(), id, request, cancellationToken));

    [Authorize(Roles = "admin"), HttpPut("{id:guid}/role")]
    public async Task<ActionResult<UserDto>> ChangeRole(Guid id, ChangeRoleRequest request, CancellationToken cancellationToken) =>
        Ok(await service.ChangeRoleAsync(User.UserId(), id, request.Role, cancellationToken));

    [Authorize(Roles = "admin"), HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await service.DeleteAsync(User.UserId(), id, cancellationToken);
        return NoContent();
    }
}

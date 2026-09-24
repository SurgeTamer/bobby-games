using BobbyGames.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BobbyGames.Presentation.Controllers;

[ApiController, Authorize, Route("api/cart")]
public sealed class CartController(CartService service) : ControllerBase
{
    [HttpGet]
    public ActionResult<CartDto> Get() => Ok(service.Get(User.UserId()));

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> Add(AddCartItemRequest request, CancellationToken cancellationToken) =>
        Ok(await service.AddAsync(User.UserId(), request, cancellationToken));

    [HttpPut("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> Update(Guid id, ChangeQuantityRequest request, CancellationToken cancellationToken) =>
        Ok(await service.UpdateAsync(User.UserId(), id, request.Quantity, cancellationToken));

    [HttpDelete("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> Delete(Guid id, CancellationToken cancellationToken) =>
        Ok(await service.DeleteAsync(User.UserId(), id, cancellationToken));
}

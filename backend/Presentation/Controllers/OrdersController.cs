using BobbyGames.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BobbyGames.Presentation.Controllers;

[ApiController, Authorize, Route("api/orders")]
public sealed class OrdersController(OrderService service) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<OrderDto>> GetAll() => Ok(service.GetAll(User.UserId(), User.IsAdmin()));

    [HttpGet("{id:guid}")]
    public ActionResult<OrderDto> Get(Guid id) => Ok(service.Get(User.UserId(), User.IsAdmin(), id));

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CancellationToken cancellationToken)
    {
        var order = await service.CreateAsync(User.UserId(), cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
    }

    [Authorize(Roles = "admin"), HttpPut("{id:guid}/status")]
    public async Task<ActionResult<OrderDto>> ChangeStatus(Guid id, ChangeStatusRequest request, CancellationToken cancellationToken) =>
        Ok(await service.ChangeStatusAsync(id, request.Status, cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        await service.CancelAsync(User.UserId(), User.IsAdmin(), id, cancellationToken);
        return NoContent();
    }
}

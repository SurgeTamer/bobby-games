using BobbyGames.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BobbyGames.Presentation.Controllers;

[ApiController, Route("api/games")]
public sealed class GamesController(CatalogService service) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<GameDto>> GetAll(string? query, string? category, string? tag) =>
        Ok(service.GetGames(query, category, tag));

    [HttpGet("{id}")]
    public ActionResult<GameDto> Get(string id) => Ok(service.GetGame(id));

    [Authorize(Roles = "admin"), HttpPost]
    public async Task<ActionResult<GameDto>> Create(SaveGameRequest request, CancellationToken cancellationToken)
    {
        var game = await service.CreateGameAsync(request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = game.Id }, game);
    }

    [Authorize(Roles = "admin"), HttpPut("{id}")]
    public async Task<ActionResult<GameDto>> Update(string id, SaveGameRequest request, CancellationToken cancellationToken) =>
        Ok(await service.UpdateGameAsync(id, request, cancellationToken));

    [Authorize(Roles = "admin"), HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        await service.DeleteGameAsync(id, cancellationToken);
        return NoContent();
    }
}

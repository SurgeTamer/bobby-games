using BobbyGames.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BobbyGames.Presentation.Controllers;

[ApiController, Route("api/categories")]
public sealed class CategoriesController(CatalogService service) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<CategoryDto>> GetAll() => Ok(service.GetCategories());

    [Authorize(Roles = "admin"), HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(SaveCategoryRequest request, CancellationToken cancellationToken) =>
        StatusCode(StatusCodes.Status201Created, await service.CreateCategoryAsync(request, cancellationToken));

    [Authorize(Roles = "admin"), HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(string id, SaveCategoryRequest request, CancellationToken cancellationToken) =>
        Ok(await service.UpdateCategoryAsync(id, request, cancellationToken));

    [Authorize(Roles = "admin"), HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        await service.DeleteCategoryAsync(id, cancellationToken);
        return NoContent();
    }
}

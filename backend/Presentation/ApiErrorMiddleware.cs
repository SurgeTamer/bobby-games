using BobbyGames.Core;

namespace BobbyGames.Presentation;

public sealed class ApiErrorMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception exception) when (exception is ValidationException or NotFoundException or ConflictException or ForbiddenException)
        {
            var status = exception switch
            {
                ValidationException => StatusCodes.Status400BadRequest,
                ForbiddenException => StatusCodes.Status403Forbidden,
                NotFoundException => StatusCodes.Status404NotFound,
                ConflictException => StatusCodes.Status409Conflict,
                _ => StatusCodes.Status500InternalServerError
            };
            context.Response.StatusCode = status;
            await context.Response.WriteAsJsonAsync(new { title = exception.Message, status });
        }
    }
}

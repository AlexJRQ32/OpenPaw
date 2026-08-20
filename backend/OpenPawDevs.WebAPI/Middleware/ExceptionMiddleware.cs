using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text.Json;

namespace OpenPawDevs.WebAPI.Middleware;

/// <summary> Middleware global de manejo de errores (Todas los Epics). Captura excepciones y retorna respuestas JSON consistentes </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Recurso no encontrado: {Message}", ex.Message);
            await HandleExceptionAsync(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Acceso no autorizado: {Message}", ex.Message);
            await HandleExceptionAsync(context, HttpStatusCode.Unauthorized, "No autorizado");
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Error de validacion: {Message}", ex.Message);
            await HandleExceptionAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error interno del servidor: {Message}", ex.Message);
            await HandleExceptionAsync(
                context,
                HttpStatusCode.InternalServerError,
                "Ocurrio un error inesperado en el servidor");
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, string mensaje)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            statusCode = context.Response.StatusCode,
            mensaje,
            traceId = context.TraceIdentifier
        };

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}

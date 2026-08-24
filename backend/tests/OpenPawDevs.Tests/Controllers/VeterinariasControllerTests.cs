using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Veterinaria;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Sprint 1 - Tarea 6: tests del PUT /api/veterinarias/{id} (control de acceso + validacion).
/// El control de acceso del PUT: solo el dueno (entity.UsuarioId == usuario autenticado)
/// o un administrador (rol "1") pueden modificar una veterinaria (previene IDOR).
/// </summary>
public class VeterinariasControllerTests
{
    private readonly Mock<IVeterinariaRepository> _veterinarias = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private VeterinariasController CreateSut(int usuarioId = 3, int rolId = 4)
    {
        var controller = new VeterinariasController(_veterinarias.Object, _usuarios.Object);

        // "sub" lo lee GetAuthenticatedUserId(); "rol" como tipo de claim para User.IsInRole("1").
        var claims = new List<Claim>
        {
            new("sub", usuarioId.ToString()),
            new("rol", rolId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "test", ClaimTypes.NameIdentifier, "rol");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public async Task Update_DuenioPuedeActualizarSuVeterinaria_DebeRetornar200()
    {
        var entity = new Veterinaria { Id = 5, UsuarioId = 3, Nombre = "Vet Original", Direccion = "San Jose" };
        _veterinarias.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 4)
            .UpdateAsync(5, new ActualizarVeterinariaDto { Direccion = "Heredia" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Direccion.Should().Be("Heredia");
        _veterinarias.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_ClienteQueNoEsDuenio_DebeRetornar403()
    {
        var entity = new Veterinaria { Id = 5, UsuarioId = 3, Nombre = "Vet Ajena" };
        _veterinarias.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 99, rolId: 4)
            .UpdateAsync(5, new ActualizarVeterinariaDto { Direccion = "Heredia" });

        result.Should().BeOfType<ForbidResult>();
        _veterinarias.Verify(r => r.UpdateAsync(It.IsAny<Veterinaria>()), Times.Never);
    }

    [Fact]
    public async Task Update_AdministradorPuedeActualizarVeterinariaAjena_DebeRetornar200()
    {
        var entity = new Veterinaria { Id = 5, UsuarioId = 3, Nombre = "Vet Ajena" };
        _veterinarias.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(5, new ActualizarVeterinariaDto { Direccion = "Cartago" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Direccion.Should().Be("Cartago");
        _veterinarias.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_IdInexistente_DebeRetornar404()
    {
        _veterinarias.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Veterinaria?)null);

        var result = await CreateSut(usuarioId: 3, rolId: 4)
            .UpdateAsync(999, new ActualizarVeterinariaDto { Direccion = "Heredia" });

        result.Should().BeOfType<NotFoundObjectResult>();
        _veterinarias.Verify(r => r.UpdateAsync(It.IsAny<Veterinaria>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConDireccionDemasiadoLarga_DebeRetornar400No500()
    {
        var entity = new Veterinaria { Id = 5, UsuarioId = 3, Direccion = "Corta" };
        _veterinarias.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var sut = CreateSut(usuarioId: 3, rolId: 4);
        var dto = new ActualizarVeterinariaDto { Direccion = new string('a', 400) };

        // La BD limita Direccion a 300 (VeterinariaConfiguration). Sin [StringLength], un PUT de
        // 400 chars llegaria a la BD y lanzaria DbUpdateException -> 500. Ahora la validacion lo
        // rechaza y el controller devuelve 400 sin persistir.
        var errores = Validate(dto);
        errores.Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarVeterinariaDto.Direccion)));
        foreach (var error in errores)
            sut.ModelState.AddModelError(string.Join(",", error.MemberNames), error.ErrorMessage ?? "Invalido");

        var result = await sut.UpdateAsync(5, dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _veterinarias.Verify(r => r.UpdateAsync(It.IsAny<Veterinaria>()), Times.Never);
    }
}
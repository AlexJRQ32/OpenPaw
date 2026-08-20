using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Usuario;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Tests del UsuariosController. Cubre GET /api/usuarios/me/veterinaria-info, usado por el
/// formulario de emergencias (PBI 133) para poblar el selector de mascotas del veterinario.
/// </summary>
public class UsuariosControllerTests
{
    private readonly Mock<IUsuarioRepository> _usuarios = new();
    private readonly Mock<INotificacionRepository> _notificaciones = new();
    private readonly Mock<IVeterinariaRepository> _veterinarias = new();
    private readonly Mock<IAlmacenRepository> _almacenes = new();
    private readonly Mock<IMascotaRepository> _mascotas = new();
    private readonly Mock<ICitaRepository> _citas = new();

    private UsuariosController CreateSut(int? usuarioAutenticadoId = null)
    {
        var controller = new UsuariosController(
            _usuarios.Object, _notificaciones.Object, _veterinarias.Object,
            _almacenes.Object, _mascotas.Object, _citas.Object);

        if (usuarioAutenticadoId.HasValue)
            SetAuthenticatedUser(controller, usuarioAutenticadoId.Value);

        return controller;
    }

    private static void SetAuthenticatedUser(ControllerBase controller, int userId)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    [Fact]
    public async Task GetMiVeterinariaInfo_ComoVeterinaria_DebeListarMascotasPorVeterinariaAsignada()
    {
        var veterinario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(veterinario);
        var mascotasDeLaVeterinaria = new List<Mascota> { new() { Id = 1, Nombre = "Firulais", VeterinariaId = 4 } };
        _mascotas.Setup(r => r.GetByVeterinariaIdAsync(4)).ReturnsAsync(mascotasDeLaVeterinaria);
        _citas.Setup(r => r.GetByUsuarioIdAsync(3)).ReturnsAsync(new List<Cita>());

        var result = await CreateSut(3).GetMiVeterinariaInfoAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<InfoPerfilDto>().Subject;
        dto.Mascotas.Should().ContainSingle(m => m.Id == 1 && m.Nombre == "Firulais");
        _mascotas.Verify(r => r.GetByDuenioIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetMiVeterinariaInfo_ComoVeterinariaSinVeterinariaAsignada_DebeCaerAMascotasPropias()
    {
        // Un usuario con RolId Veterinaria pero sin VeterinariaId asignado no cumple la
        // condición del branch de veterinaria, así que cae al branch de propietario
        // (mismo patrón que TrasladosExpedienteController.GetAllAsync).
        var veterinario = new Usuario { Id = 3, RolId = 2, VeterinariaId = null };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(veterinario);
        _mascotas.Setup(r => r.GetByDuenioIdAsync(3)).ReturnsAsync(new List<Mascota>());
        _citas.Setup(r => r.GetByUsuarioIdAsync(3)).ReturnsAsync(new List<Cita>());

        var result = await CreateSut(3).GetMiVeterinariaInfoAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<InfoPerfilDto>().Subject;
        dto.Mascotas.Should().BeEmpty();
        _mascotas.Verify(r => r.GetByVeterinariaIdAsync(It.IsAny<int>()), Times.Never);
        _mascotas.Verify(r => r.GetByDuenioIdAsync(3), Times.Once);
    }

    [Fact]
    public async Task GetMiVeterinariaInfo_ComoCliente_DebeListarMascotasPropias()
    {
        var cliente = new Usuario { Id = 5, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(cliente);
        var mascotasPropias = new List<Mascota> { new() { Id = 2, Nombre = "Misi", DuenioId = 5 } };
        _mascotas.Setup(r => r.GetByDuenioIdAsync(5)).ReturnsAsync(mascotasPropias);
        _citas.Setup(r => r.GetByUsuarioIdAsync(5)).ReturnsAsync(new List<Cita>());

        var result = await CreateSut(5).GetMiVeterinariaInfoAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<InfoPerfilDto>().Subject;
        dto.Mascotas.Should().ContainSingle(m => m.Id == 2 && m.Nombre == "Misi");
        _mascotas.Verify(r => r.GetByVeterinariaIdAsync(It.IsAny<int>()), Times.Never);
    }
}

using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Aporte;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Tests del ExpedienteAportesController (PBI 132 - Aporte de expediente para veterinarias
/// fuera de la plataforma). Se mockean los repositorios y se invocan los métodos del
/// controlador directamente.
/// </summary>
public class ExpedienteAportesControllerTests
{
    private readonly Mock<IAporteExpedienteRepository> _aportes = new();
    private readonly Mock<IMascotaRepository> _mascotas = new();

    private ExpedienteAportesController CreateSut(int? usuarioAutenticadoId = null, params string[] roles)
    {
        var controller = new ExpedienteAportesController(_aportes.Object, _mascotas.Object);

        if (usuarioAutenticadoId.HasValue)
            SetAuthenticatedUser(controller, usuarioAutenticadoId.Value, roles);

        return controller;
    }

    private static void SetAuthenticatedUser(ControllerBase controller, int userId, params string[] roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString())
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var identity = new ClaimsIdentity(claims, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static Mascota MascotaDe(int mascotaId, int duenioId, int? veterinariaId = null) => new()
    {
        Id = mascotaId,
        DuenioId = duenioId,
        VeterinariaId = veterinariaId
    };

    private static CrearAporteExpedienteDto DtoValido(int mascotaId) => new()
    {
        MascotaId = mascotaId,
        VeterinariaNombre = "Clinica Externa",
        FechaAtencion = DateTime.UtcNow.AddDays(-1),
        TipoAtencion = TipoAtencion.Consulta,
        Descripcion = "Consulta de rutina"
    };

    private static AporteExpediente AporteDe(int id, int propietarioId) => new()
    {
        Id = id,
        MascotaId = 1,
        PropietarioId = propietarioId,
        VeterinariaNombre = "Clinica Original",
        FechaAtencion = DateTime.UtcNow.AddDays(-5),
        TipoAtencion = TipoAtencion.Vacuna,
        Descripcion = "Descripcion original",
        Diagnostico = "Diagnostico original",
        Medicamentos = "Medicamento original",
        ArchivoAdjuntoUrl = "https://ejemplo.com/receta-original.pdf",
        FechaRegistro = DateTime.UtcNow.AddDays(-5)
    };

    // ─────────────────────────────────────────────────────────────
    // GET /api/expediente-aportes
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByMascota_ConMascotaInexistente_DebeRetornar404()
    {
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Mascota?)null);

        var result = await CreateSut(5).GetByMascotaAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetByMascota_ConUsuarioQueNoEsDuenio_DebeRetornar403()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var result = await CreateSut(999).GetByMascotaAsync(1);

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.GetByMascotaIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetByMascota_ConDuenio_DebeRetornarListaDeAportes()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var aportes = new List<AporteExpediente> { new() { Id = 1, MascotaId = 1, PropietarioId = 5 } };
        _aportes.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(aportes);

        var result = await CreateSut(5).GetByMascotaAsync(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(aportes);
    }

    [Fact]
    public async Task GetByMascota_ComoVeterinario_DebeRetornarListaDeAportes()
    {
        var mascota = MascotaDe(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var aportes = new List<AporteExpediente> { new() { Id = 1, MascotaId = 1, PropietarioId = 5 } };
        _aportes.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(aportes);

        var result = await CreateSut(999, "2").GetByMascotaAsync(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(aportes);
        _aportes.Verify(r => r.GetByMascotaIdAsync(1), Times.Once);
    }

    [Fact]
    public async Task GetByMascota_ComoAdministrador_DebeRetornarListaDeAportes()
    {
        var mascota = MascotaDe(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var aportes = new List<AporteExpediente> { new() { Id = 1, MascotaId = 1, PropietarioId = 5 } };
        _aportes.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(aportes);

        var result = await CreateSut(999, "1").GetByMascotaAsync(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(aportes);
        _aportes.Verify(r => r.GetByMascotaIdAsync(1), Times.Once);
    }

    [Fact]
    public async Task GetByMascota_ComoClienteSinRelacion_DebeRetornar403()
    {
        var mascota = MascotaDe(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var result = await CreateSut(999, "4").GetByMascotaAsync(1);

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.GetByMascotaIdAsync(It.IsAny<int>()), Times.Never);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/expediente-aportes
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ConDatosValidos_DebeRetornar201()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _aportes.Setup(r => r.AddAsync(It.IsAny<AporteExpediente>()))
            .Callback<AporteExpediente>(a => a.Id = 50)
            .ReturnsAsync((AporteExpediente a) => a);

        var dto = DtoValido(1);

        var result = await CreateSut(5).CreateAsync(dto);

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/expediente-aportes/50");
        _aportes.Verify(r => r.AddAsync(It.Is<AporteExpediente>(
            a => a.MascotaId == 1
                 && a.PropietarioId == 5
                 && a.VeterinariaNombre == "Clinica Externa"
                 && a.TipoAtencion == TipoAtencion.Consulta)), Times.Once);
    }

    [Fact]
    public async Task Create_ConMascotaInexistente_DebeRetornar404()
    {
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Mascota?)null);

        var result = await CreateSut(5).CreateAsync(DtoValido(1));

        result.Should().BeOfType<NotFoundObjectResult>();
        _aportes.Verify(r => r.AddAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConUsuarioQueNoEsDuenio_DebeRetornar403()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var result = await CreateSut(999).CreateAsync(DtoValido(1));

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.AddAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConFechaDeAtencionEnElFuturo_DebeRetornar400()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var dto = DtoValido(1);
        dto.FechaAtencion = DateTime.UtcNow.AddDays(1);

        var result = await CreateSut(5).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _aportes.Verify(r => r.AddAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConArchivoAdjuntoUrlConEsquemaPeligroso_DebeRetornar400()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        // Esquemas no http/https (javascript:, data:, ftp:) deben rechazarse igual que en el PUT.
        var dto = DtoValido(1);
        dto.ArchivoAdjuntoUrl = "javascript:alert(1)";

        var result = await CreateSut(5).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _aportes.Verify(r => r.AddAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConArchivoAdjuntoUrlHttpsValida_DebeRetornar201()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _aportes.Setup(r => r.AddAsync(It.IsAny<AporteExpediente>()))
            .Callback<AporteExpediente>(a => a.Id = 51)
            .ReturnsAsync((AporteExpediente a) => a);

        var dto = DtoValido(1);
        dto.ArchivoAdjuntoUrl = "https://ejemplo.com/receta.pdf";

        var result = await CreateSut(5).CreateAsync(dto);

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/expediente-aportes/51");
        _aportes.Verify(r => r.AddAsync(It.Is<AporteExpediente>(
            a => a.ArchivoAdjuntoUrl == "https://ejemplo.com/receta.pdf")), Times.Once);
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /api/expediente-aportes/{id}
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ConAporteInexistente_DebeRetornar404()
    {
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((AporteExpediente?)null);

        var result = await CreateSut(5).DeleteAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Delete_ConAporteDeOtroUsuario_DebeRetornar403()
    {
        var aporte = new AporteExpediente { Id = 1, MascotaId = 1, PropietarioId = 5 };
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var result = await CreateSut(999).DeleteAsync(1);

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.DeleteAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Delete_ConAporteDelPropietario_DebeEliminarYRetornar204()
    {
        var aporte = new AporteExpediente { Id = 1, MascotaId = 1, PropietarioId = 5 };
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var result = await CreateSut(5).DeleteAsync(1);

        result.Should().BeOfType<NoContentResult>();
        _aportes.Verify(r => r.DeleteAsync(aporte), Times.Once);
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /api/expediente-aportes/{id} (Sprint 2 - Tarea 36)
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ConAporteInexistente_DebeRetornar404()
    {
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((AporteExpediente?)null);

        var dto = new ActualizarAporteExpedienteDto { Descripcion = "Nueva descripcion" };

        var result = await CreateSut(5).UpdateAsync(1, dto);

        result.Should().BeOfType<NotFoundObjectResult>();
        _aportes.Verify(r => r.UpdateAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConUsuarioSinRelacion_DebeRetornar403()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var dto = new ActualizarAporteExpedienteDto { Descripcion = "Intento de edicion" };

        var result = await CreateSut(999).UpdateAsync(1, dto);

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.UpdateAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConVeterinarioSinSerDuenio_DebeRetornar403()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var dto = new ActualizarAporteExpedienteDto { Descripcion = "Intento de edicion" };

        var result = await CreateSut(999, "2").UpdateAsync(1, dto);

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.UpdateAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Update_DuenioActualizaCampos_DebeRetornar204YAplicarCambios()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var dto = new ActualizarAporteExpedienteDto
        {
            VeterinariaNombre = "  Clinica Editada  ",
            FechaAtencion = DateTime.UtcNow.AddDays(-2),
            TipoAtencion = "emergencia", // case-insensitive -> normalizado a Emergencia
            Descripcion = "Descripcion editada",
            Diagnostico = "Diagnostico editado",
            Medicamentos = "Antiinflamatorio",
            ArchivoAdjuntoUrl = "https://ejemplo.com/nueva-receta.pdf"
        };

        var result = await CreateSut(5).UpdateAsync(1, dto);

        result.Should().BeOfType<NoContentResult>();
        _aportes.Verify(r => r.UpdateAsync(It.Is<AporteExpediente>(a =>
            a.Id == 1
            && a.VeterinariaNombre == "Clinica Editada"
            && a.TipoAtencion == TipoAtencion.Emergencia
            && a.Descripcion == "Descripcion editada"
            && a.Diagnostico == "Diagnostico editado"
            && a.Medicamentos == "Antiinflamatorio"
            && a.ArchivoAdjuntoUrl == "https://ejemplo.com/nueva-receta.pdf")), Times.Once);
    }

    [Fact]
    public async Task Update_ComoAdministrador_DebeRetornar204YAplicarCambios()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var dto = new ActualizarAporteExpedienteDto { Descripcion = "Editado por admin" };

        var result = await CreateSut(999, "1").UpdateAsync(1, dto);

        result.Should().BeOfType<NoContentResult>();
        _aportes.Verify(r => r.UpdateAsync(It.Is<AporteExpediente>(
            a => a.Descripcion == "Editado por admin")), Times.Once);
    }

    [Fact]
    public async Task Update_ConCamposNulos_PreservaValoresActuales()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        var veterinariaOriginal = aporte.VeterinariaNombre;
        var fechaOriginal = aporte.FechaAtencion;
        var tipoOriginal = aporte.TipoAtencion;
        var diagnosticoOriginal = aporte.Diagnostico;
        var medicamentosOriginal = aporte.Medicamentos;
        var urlOriginal = aporte.ArchivoAdjuntoUrl;
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        // Solo se envia Descripcion; el resto null debe preservarse (update parcial).
        var dto = new ActualizarAporteExpedienteDto { Descripcion = "Solo la descripcion cambia" };

        var result = await CreateSut(5).UpdateAsync(1, dto);

        result.Should().BeOfType<NoContentResult>();
        aporte.Descripcion.Should().Be("Solo la descripcion cambia");
        aporte.VeterinariaNombre.Should().Be(veterinariaOriginal);
        aporte.FechaAtencion.Should().Be(fechaOriginal);
        aporte.TipoAtencion.Should().Be(tipoOriginal);
        aporte.Diagnostico.Should().Be(diagnosticoOriginal);
        aporte.Medicamentos.Should().Be(medicamentosOriginal);
        aporte.ArchivoAdjuntoUrl.Should().Be(urlOriginal);
        _aportes.Verify(r => r.UpdateAsync(aporte), Times.Once);
    }

    [Fact]
    public async Task Update_ConTipoAtencionInvalido_DebeRetornar400()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        // Enum.TryParse("999") parsea como numerico; sin IsDefined se persistiria un valor invalido.
        var dto = new ActualizarAporteExpedienteDto { TipoAtencion = "999" };

        var result = await CreateSut(5).UpdateAsync(1, dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _aportes.Verify(r => r.UpdateAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConTipoAtencionTextoInvalido_DebeRetornar400()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var dto = new ActualizarAporteExpedienteDto { TipoAtencion = "Cirugia" };

        var result = await CreateSut(5).UpdateAsync(1, dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _aportes.Verify(r => r.UpdateAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConFechaDeAtencionEnElFuturo_DebeRetornar400()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var dto = new ActualizarAporteExpedienteDto { FechaAtencion = DateTime.UtcNow.AddDays(1) };

        var result = await CreateSut(5).UpdateAsync(1, dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _aportes.Verify(r => r.UpdateAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConArchivoAdjuntoUrlInvalida_DebeRetornar400()
    {
        var aporte = AporteDe(1, propietarioId: 5);
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var dto = new ActualizarAporteExpedienteDto { ArchivoAdjuntoUrl = "ftp://ejemplo.com/receta.pdf" };

        var result = await CreateSut(5).UpdateAsync(1, dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _aportes.Verify(r => r.UpdateAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }
}

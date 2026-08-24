using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Tests del RedesSocialesController. Cubre el upsert de redes sociales: normalización
/// case-insensitive de plataforma (regresión de duplicados), validación de URL y whitelist.
/// </summary>
public class RedesSocialesControllerTests
{
    private readonly Mock<IRedSocialRepository> _redes = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private RedesSocialesController CreateSut(int usuarioAutenticadoId)
    {
        var controller = new RedesSocialesController(_redes.Object, _usuarios.Object);
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuarioAutenticadoId.ToString())
        }, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    [Fact]
    public async Task Upsert_PlataformaConMayusculas_ActualizaElMismoRegistro()
    {
        var existente = new RedSocial { Id = 10, UsuarioId = 1, Plataforma = "linkedin", Url = "https://linkedin.com/viejo" };
        _redes.Setup(r => r.GetByUsuarioIdAsync(1)).ReturnsAsync(new List<RedSocial> { existente });

        var result = await CreateSut(1).UpsertAsync("LinkedIn", "https://linkedin.com/nuevo");

        result.Should().BeOfType<NoContentResult>();
        existente.Url.Should().Be("https://linkedin.com/nuevo");
        existente.Plataforma.Should().Be("linkedin");
        _redes.Verify(r => r.UpdateAsync(existente), Times.Once);
        _redes.Verify(r => r.AddAsync(It.IsAny<RedSocial>()), Times.Never);
    }

    [Fact]
    public async Task Upsert_PlataformaConMayusculas_SinRegistro_CreaConPlataformaNormalizada()
    {
        _redes.Setup(r => r.GetByUsuarioIdAsync(1)).ReturnsAsync(new List<RedSocial>());

        RedSocial? agregada = null;
        _redes.Setup(r => r.AddAsync(It.IsAny<RedSocial>()))
            .Callback<RedSocial>(r => agregada = r)
            .ReturnsAsync((RedSocial r) => r);

        var result = await CreateSut(1).UpsertAsync("LinkedIn", "https://linkedin.com/perfil");

        result.Should().BeOfType<NoContentResult>();
        agregada.Should().NotBeNull();
        agregada!.Plataforma.Should().Be("linkedin");
        agregada.Url.Should().Be("https://linkedin.com/perfil");
        agregada.UsuarioId.Should().Be(1);
    }

    [Fact]
    public async Task Upsert_PlataformaInvalida_DebeRechazar()
    {
        var result = await CreateSut(1).UpsertAsync("myspace", "https://myspace.com/x");

        result.Should().BeOfType<BadRequestObjectResult>();
        _redes.Verify(r => r.UpdateAsync(It.IsAny<RedSocial>()), Times.Never);
        _redes.Verify(r => r.AddAsync(It.IsAny<RedSocial>()), Times.Never);
    }

    [Fact]
    public async Task Upsert_UrlNulaODemasiadoLarga_DebeRechazar()
    {
        var sut = CreateSut(1);

        var conNull = await sut.UpsertAsync("facebook", null);
        conNull.Should().BeOfType<BadRequestObjectResult>();

        var muyLarga = await sut.UpsertAsync("facebook", "https://ejemplo.com/" + new string('x', 500));
        muyLarga.Should().BeOfType<BadRequestObjectResult>();

        _redes.Verify(r => r.UpdateAsync(It.IsAny<RedSocial>()), Times.Never);
        _redes.Verify(r => r.AddAsync(It.IsAny<RedSocial>()), Times.Never);
    }

    [Fact]
    public async Task Upsert_UrlConProtocoloNoHttp_DebeRechazar()
    {
        var result = await CreateSut(1).UpsertAsync("website", "ftp://servidor/archivo");

        result.Should().BeOfType<BadRequestObjectResult>();
        _redes.Verify(r => r.AddAsync(It.IsAny<RedSocial>()), Times.Never);
    }

    [Fact]
    public async Task Upsert_UrlRelativa_DebeRechazar()
    {
        var result = await CreateSut(1).UpsertAsync("website", "www.ejemplo.com/sin-protocolo");

        result.Should().BeOfType<BadRequestObjectResult>();
        _redes.Verify(r => r.AddAsync(It.IsAny<RedSocial>()), Times.Never);
    }

    [Fact]
    public async Task Delete_PlataformaVinculada_EliminaElRegistroYDevuelveNoContent()
    {
        var existente = new RedSocial { Id = 5, UsuarioId = 1, Plataforma = "github", Url = "https://github.com/roble" };
        _redes.Setup(r => r.GetByUsuarioIdAsync(1)).ReturnsAsync(new List<RedSocial> { existente });

        var result = await CreateSut(1).DeleteAsync("github");

        result.Should().BeOfType<NoContentResult>();
        _redes.Verify(r => r.DeleteAsync(existente), Times.Once);
        _redes.Verify(r => r.AddAsync(It.IsAny<RedSocial>()), Times.Never);
    }

    [Fact]
    public async Task Delete_PlataformaVinculadaConMayusculas_NormalizaYEliminaElRegistro()
    {
        var existente = new RedSocial { Id = 6, UsuarioId = 1, Plataforma = "linkedin", Url = "https://linkedin.com/perfil" };
        _redes.Setup(r => r.GetByUsuarioIdAsync(1)).ReturnsAsync(new List<RedSocial> { existente });

        var result = await CreateSut(1).DeleteAsync("LinkedIn");

        result.Should().BeOfType<NoContentResult>();
        _redes.Verify(r => r.DeleteAsync(existente), Times.Once);
    }

    [Fact]
    public async Task Delete_PlataformaNoVinculada_DevuelveNotFound()
    {
        _redes.Setup(r => r.GetByUsuarioIdAsync(1)).ReturnsAsync(new List<RedSocial>());

        var result = await CreateSut(1).DeleteAsync("youtube");

        result.Should().BeOfType<NotFoundObjectResult>();
        _redes.Verify(r => r.DeleteAsync(It.IsAny<RedSocial>()), Times.Never);
    }

    [Fact]
    public async Task Delete_PlataformaNoPermitida_DebeRechazar()
    {
        _redes.Setup(r => r.GetByUsuarioIdAsync(1)).ReturnsAsync(new List<RedSocial>());

        var result = await CreateSut(1).DeleteAsync("myspace");

        result.Should().BeOfType<BadRequestObjectResult>();
        _redes.Verify(r => r.DeleteAsync(It.IsAny<RedSocial>()), Times.Never);
    }
}
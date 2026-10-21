using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Affinovas.Application.Common.Interfaces;
using Affinovas.Infrastructure.Authentication;
using Affinovas.Infrastructure.Data;

namespace Affinovas.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        return services;
    }
}

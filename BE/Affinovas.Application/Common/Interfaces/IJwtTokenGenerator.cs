using Affinovas.Domain.Entities;

namespace Affinovas.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}

using System.Data;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Affinovas.Application.Common.Interfaces;

namespace Affinovas.Infrastructure.Data;

public class SqliteConnectionFactory : ISqlConnectionFactory
{
    private readonly string _connectionString;

    public SqliteConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Data Source=affinovas.db";
    }

    public IDbConnection CreateConnection()
    {
        var connection = new SqliteConnection(_connectionString);
        connection.Open();
        return connection;
    }
}

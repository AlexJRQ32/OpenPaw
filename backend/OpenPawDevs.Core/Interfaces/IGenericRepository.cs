namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio genérico con operaciones CRUD base (Todas las Epics)
/// </summary>
public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task<IReadOnlyList<T>> GetAllAsync();
    Task<IReadOnlyList<T>> GetPagedAsync(int page, int pageSize);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task<bool> ExistsAsync(int id);
    Task<int> CountAsync();
}

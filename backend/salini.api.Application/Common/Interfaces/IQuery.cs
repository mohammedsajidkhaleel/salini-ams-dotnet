using MediatR;

namespace salini.api.Application.Common.Interfaces;

public interface IQuery<out TResponse> : IRequest<TResponse>
{
}

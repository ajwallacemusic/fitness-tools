from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fitness_core.errors import DomainError


def _envelope(type_: str, message: str, details=None) -> dict:
    return {"error": {"type": type_, "message": message, "details": details}}


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422,
                            content=_envelope("validation_error",
                                              "Input validation failed",
                                              exc.errors()))

    @app.exception_handler(DomainError)
    async def _domain(_: Request, exc: DomainError):
        return JSONResponse(status_code=400,
                            content=_envelope("domain_error", str(exc)))

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException):
        type_ = "not_found" if exc.status_code == 404 else "http_error"
        return JSONResponse(status_code=exc.status_code,
                            content=_envelope(type_, str(exc.detail)))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=_envelope("internal_error", "An unexpected error occurred"),
        )

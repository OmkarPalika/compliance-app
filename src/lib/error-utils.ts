export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message || 'An error occurred',
      response.status,
      error.code
    );
  }

  return response.json();
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown, language: 'en' | 'ar'): string {
  if (isApiError(error)) {
    switch (error.status) {
      case 401:
        return language === 'en'
          ? 'Please sign in to continue'
          : 'يرجى تسجيل الدخول للمتابعة';
      case 403:
        return language === 'en'
          ? 'You do not have permission to perform this action'
          : 'ليس لديك صلاحية لتنفيذ هذا الإجراء';
      case 404:
        return language === 'en'
          ? 'The requested resource was not found'
          : 'لم يتم العثور على المحتوى المطلوب';
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return language === 'en'
    ? 'An unexpected error occurred'
    : 'حدث خطأ غير متوقع';
}

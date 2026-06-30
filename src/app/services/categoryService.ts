import BASE_URL, { getHeaders } from './api';

export interface CategoryResource {
  id: number;
  teamId: number;
  name: string;
  limitDate: string;
  status: 'TO_DO' | 'IN_PROGRESS' | 'DONE';
  memberIds: number[];
  ganttSpreadsheetUrl?: string | null;
}

export const getCategoriesByTeam = async (teamId: number): Promise<CategoryResource[]> => {
  const response = await fetch(`${BASE_URL}/categories/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener categorías');
  return data;
};

export const createCategory = async (teamId: number, name: string, limitDate: string) => {
  const response = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ teamId, name, limitDate }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al crear categoría');
  return data;
};

export const updateCategory = async (categoryId: number, name: string, status: string | null, limitDate: string) => {
  const response = await fetch(`${BASE_URL}/categories/${categoryId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ name, status, limitDate }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar categoría');
  return data;
};

export const addMemberToCategory = async (categoryId: number, userId: number) => {
  const response = await fetch(`${BASE_URL}/categories/${categoryId}/members`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al agregar miembro');
  return data;
};

export const removeMemberFromCategory = async (categoryId: number, userId: number) => {
  const response = await fetch(`${BASE_URL}/categories/${categoryId}/members/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al quitar miembro');
  return data;
};

export const createCategoryGantt = async (categoryId: number): Promise<CategoryResource> => {
  const response = await fetch(`${BASE_URL}/categories/${categoryId}/gantt`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await response.json();
  const formatGanttError = (message: string) => {
    if (/storageQuotaExceeded|storage quota has been exceeded/i.test(message)) {
      return 'La cuenta de servicio de Google no tiene espacio en Drive. Crea una Unidad compartida (Shared Drive), añade la service account como colaboradora, configura GANTT_OUTPUT_FOLDER_ID en Azure con el ID de una carpeta dentro de esa unidad y reinicia el backend.';
    }
    return message;
  };
  if (response.status === 502) {
    throw new Error(
      formatGanttError(
        data.message ||
          'No se pudo conectar con Google Sheets. Verifica la configuración de Gantt en Azure.'
      )
    );
  }
  if (!response.ok) throw new Error(formatGanttError(data.message || 'Error al generar el Gantt'));
  return data;
};
export type TaskStatus = 'Pendiente' | 'En progreso' | 'Completada' | 'Cancelada';
export type TaskUrgency = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type CategoryStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

export interface TeamMember {
  id: number;
  name: string;
  initials: string;
  email: string;
  role: string;
  hoursUsed: number;
  hoursMax: number;
  skills: string[];
  color: string;
}

export interface Task {
  id: number;
  title: string;
  category: string;
  status: TaskStatus;
  assignedTo: string;
  estimatedTime: string;
  urgency: TaskUrgency;
  description?: string;
  difficulty?: string;
  dueDate?: string;
  tools?: string;
  knowledge?: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  taskCount: number;
  progress: number;
  status: CategoryStatus;
  dueDate: string;
  memberIds: number[];
}

export interface UserProfile {
  name: string;
  email: string;
  position: string;
  role: string;
  initials: string;
  maxHours: number;
  activeHours: number;
  abilities: string[];
  interests: string[];
  taskStatusCounts: {
    toDoCount: number;
    inProgressCount: number;
    doneCount: number;
  };
}

export const teamMembers: TeamMember[] = [
  { id: 1, name: 'Ana García', initials: 'AG', email: 'ana@plannia.io', role: 'Frontend Developer', hoursUsed: 32, hoursMax: 40, skills: ['React', 'TypeScript', 'CSS', 'Figma'], color: '#5B8DEF' },
  { id: 2, name: 'Carlos López', initials: 'CL', email: 'carlos@plannia.io', role: 'Backend Developer', hoursUsed: 28, hoursMax: 40, skills: ['Node.js', 'Python', 'PostgreSQL', 'REST APIs'], color: '#7C6FE8' },
  { id: 3, name: 'María Rodríguez', initials: 'MR', email: 'maria@plannia.io', role: 'UX Designer', hoursUsed: 20, hoursMax: 40, skills: ['Figma', 'Wireframing', 'Research', 'Prototipado'], color: '#10B981' },
  { id: 4, name: 'Diego Martínez', initials: 'DM', email: 'diego@plannia.io', role: 'DevOps Engineer', hoursUsed: 36, hoursMax: 40, skills: ['Docker', 'AWS', 'CI/CD', 'Kubernetes'], color: '#F59E0B' },
  { id: 5, name: 'Laura Sánchez', initials: 'LS', email: 'laura@plannia.io', role: 'QA Engineer', hoursUsed: 18, hoursMax: 40, skills: ['Testing', 'Selenium', 'Jest', 'Playwright'], color: '#EC4899' },
];

export const tasks: Task[] = [
  { id: 1, title: 'Rediseño pantalla de login', category: 'Diseño UI', status: 'En progreso', assignedTo: 'Ana García', estimatedTime: '8h', urgency: 'Alta', difficulty: 'Media', description: 'Actualizar el diseño visual de la pantalla de autenticación con la nueva identidad de marca.', dueDate: '2026-06-20', tools: 'Figma, React', knowledge: 'CSS, Diseño UX' },
  { id: 2, title: 'Migración de base de datos v2', category: 'Backend', status: 'Pendiente', assignedTo: '', estimatedTime: '16h', urgency: 'Crítica', difficulty: 'Difícil', description: 'Migrar datos de usuarios a la nueva estructura de tablas PostgreSQL con campos adicionales.', dueDate: '2026-06-15', tools: 'PostgreSQL, Python', knowledge: 'Migraciones, SQL' },
  { id: 3, title: 'Prototipo móvil — Módulo v2', category: 'Diseño UI', status: 'Completada', assignedTo: 'María Rodríguez', estimatedTime: '12h', urgency: 'Media', difficulty: 'Media', description: 'Crear prototipo interactivo en Figma para la versión móvil del dashboard.', dueDate: '2026-06-10', tools: 'Figma', knowledge: 'Prototipado, UX' },
  { id: 4, title: 'Configurar pipeline CI/CD', category: 'Infraestructura', status: 'En progreso', assignedTo: 'Diego Martínez', estimatedTime: '6h', urgency: 'Alta', difficulty: 'Difícil', description: 'Implementar flujo de integración continua con GitHub Actions y despliegue automático.', dueDate: '2026-06-18', tools: 'GitHub Actions, Docker', knowledge: 'CI/CD, DevOps' },
  { id: 5, title: 'API de autenticación JWT', category: 'Backend', status: 'Pendiente', assignedTo: '', estimatedTime: '10h', urgency: 'Baja', difficulty: 'Media', description: 'Desarrollar endpoints de autenticación con tokens JWT y refresh tokens.', dueDate: '2026-06-25', tools: 'Node.js, JWT', knowledge: 'REST APIs, Seguridad' },
  { id: 6, title: 'Suite de pruebas E2E', category: 'QA', status: 'En progreso', assignedTo: 'Laura Sánchez', estimatedTime: '14h', urgency: 'Media', difficulty: 'Media', description: 'Crear batería completa de pruebas end-to-end con Playwright para el flujo principal.', dueDate: '2026-06-22', tools: 'Playwright, Jest', knowledge: 'Testing, Automatización' },
  { id: 7, title: 'Optimización de rendimiento', category: 'Frontend', status: 'Pendiente', assignedTo: '', estimatedTime: '8h', urgency: 'Media', difficulty: 'Fácil', description: 'Reducir tiempos de carga mediante lazy loading y code splitting en React.', dueDate: '2026-06-28', tools: 'React, Webpack', knowledge: 'Performance, React' },
  { id: 8, title: 'Documentación de API REST', category: 'Backend', status: 'Completada', assignedTo: 'Carlos López', estimatedTime: '5h', urgency: 'Baja', difficulty: 'Fácil', description: 'Documentar todos los endpoints en Swagger/OpenAPI 3.0.', dueDate: '2026-06-05', tools: 'Swagger', knowledge: 'OpenAPI, REST' },
  { id: 9, title: 'Sistema de diseño – componentes base', category: 'Diseño UI', status: 'Pendiente', assignedTo: 'Ana García', estimatedTime: '10h', urgency: 'Alta', difficulty: 'Media', description: 'Crear biblioteca de componentes reutilizables en Figma y React para el design system de Plannia.', dueDate: '2026-06-30', tools: 'Figma, React, TypeScript', knowledge: 'Diseño de sistemas, React' },
  { id: 10, title: 'Corrección de estilos en dashboard', category: 'Frontend', status: 'Completada', assignedTo: 'Ana García', estimatedTime: '3h', urgency: 'Baja', difficulty: 'Fácil', description: 'Revisar y corregir inconsistencias de estilos CSS en el dashboard principal para mejorar consistencia visual.', dueDate: '2026-06-05', tools: 'React, CSS', knowledge: 'CSS, Tailwind' },
];

export const categories: Category[] = [
  { id: 1, name: 'Diseño UI', color: '#5B8DEF', taskCount: 8, progress: 65, status: 'IN_PROGRESS', dueDate: '2026-06-30', memberIds: [1, 3] },
  { id: 2, name: 'Backend', color: '#7C6FE8', taskCount: 12, progress: 40, status: 'IN_PROGRESS', dueDate: '2026-07-15', memberIds: [2] },
  { id: 3, name: 'Infraestructura', color: '#10B981', taskCount: 5, progress: 80, status: 'IN_PROGRESS', dueDate: '2026-06-08', memberIds: [4] },
  { id: 4, name: 'Frontend', color: '#F59E0B', taskCount: 9, progress: 55, status: 'TO_DO', dueDate: '2026-07-01', memberIds: [1, 2] },
  { id: 5, name: 'QA', color: '#EC4899', taskCount: 6, progress: 30, status: 'TO_DO', dueDate: '2026-04-30', memberIds: [] },
];

export const userProfile: UserProfile = {
  name: 'Juan López',
  email: 'juan.lopez@plannia.io',
  position: 'Product Manager',
  role: 'Líder',
  initials: 'JL',
  maxHours: 40,
  activeHours: 12,
  abilities: ['Gestión de Proyectos', 'Scrum', 'Agile', 'Liderazgo'],
  interests: ['IA Aplicada', 'UX Research', 'Automatización', 'Product Strategy'],
  taskStatusCounts: { toDoCount: 3, inProgressCount: 3, doneCount: 2 },
};

export const memberProfile: UserProfile = {
  name: 'Ana García',
  email: 'ana@plannia.io',
  position: 'Frontend Developer',
  role: 'Miembro',
  initials: 'AG',
  maxHours: 40,
  activeHours: 32,
  abilities: ['React', 'TypeScript', 'CSS', 'Figma'],
  interests: ['Diseño de sistemas', 'Animaciones web', 'Accesibilidad UI'],
  taskStatusCounts: { toDoCount: 1, inProgressCount: 1, doneCount: 1 },
};

export const plannerTasks = [
  { id: 1, memberId: 1, title: 'Rediseño login', category: 'Diseño UI', color: '#5B8DEF', startHour: 8, endHour: 12 },
  { id: 2, memberId: 1, title: 'Optimización UI', category: 'Frontend', color: '#F59E0B', startHour: 13, endHour: 16 },
  { id: 3, memberId: 2, title: 'API JWT', category: 'Backend', color: '#7C6FE8', startHour: 9, endHour: 14 },
  { id: 4, memberId: 2, title: 'Migración DB', category: 'Backend', color: '#7C6FE8', startHour: 15, endHour: 18 },
  { id: 5, memberId: 3, title: 'Prototipo móvil', category: 'Diseño UI', color: '#5B8DEF', startHour: 8, endHour: 11 },
  { id: 6, memberId: 3, title: 'Wireframes v3', category: 'Diseño UI', color: '#10B981', startHour: 14, endHour: 17 },
  { id: 7, memberId: 4, title: 'Pipeline CI/CD', category: 'Infraestructura', color: '#10B981', startHour: 9, endHour: 18 },
  { id: 8, memberId: 5, title: 'Tests E2E', category: 'QA', color: '#EC4899', startHour: 10, endHour: 16 },
];

export const notifications = [
  { id: 1, type: 'assignment', icon: '🤖', title: 'Asignación IA confirmada', message: 'La tarea "API JWT" fue asignada automáticamente a Carlos López con 94% de coincidencia.', time: 'hace 10 min', read: false },
  { id: 2, type: 'status', icon: '✅', title: 'Tarea completada', message: 'María Rodríguez marcó como completada "Documentación de API REST".', time: 'hace 1 hora', read: false },
  { id: 3, type: 'alert', icon: '⚠️', title: 'Tarea crítica sin asignar', message: 'La tarea "Migración DB v2" lleva 3 días sin asignación. Urgencia: Crítica.', time: 'hace 2 horas', read: false },
  { id: 4, type: 'join', icon: '🤝', title: 'Nuevo miembro', message: 'Laura Sánchez se unió al equipo usando el código PL-2026.', time: 'hace 5 horas', read: true },
  { id: 5, type: 'status', icon: '🔄', title: 'Cambio de estado', message: 'Diego Martínez actualizó "Pipeline CI/CD" a En Progreso.', time: 'ayer', read: true },
  { id: 6, type: 'assignment', icon: '📋', title: 'Nueva tarea asignada', message: 'Se asignó "Suite de pruebas E2E" a Laura Sánchez mediante asignación manual.', time: 'ayer', read: true },
];

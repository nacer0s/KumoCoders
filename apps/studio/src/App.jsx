import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import StudioLayout from './components/StudioLayout.jsx';
import registerSW from './registerSW.js';
registerSW();
import TeamsPage from './pages/TeamsPage.jsx';
import TeamSettings from './pages/TeamSettings.jsx';
import TeamDashboard from './pages/TeamDashboard.jsx';
import ChatPage from './pages/ChatPage.jsx';
import VoicePage from './pages/VoicePage.jsx';
import VideoPage from './pages/VideoPage.jsx';
import CallsPage from './pages/CallsPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import FilesPage from './pages/FilesPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import WhiteboardPage from './pages/WhiteboardPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ScreenSharePage from './pages/ScreenSharePage.jsx';
import KanbanPage from './pages/KanbanPage.jsx';
import FormsPage from './pages/FormsPage.jsx';
import WikiPage from './pages/WikiPage.jsx';
import MeetingsPage from './pages/MeetingsPage.jsx';
import APIPlaygroundPage from './pages/APIPlaygroundPage.jsx';
import TimelinePage from './pages/TimelinePage.jsx';
import DatabasePage from './pages/DatabasePage.jsx';
import MindMapPage from './pages/MindMapPage.jsx';
import SprintPage from './pages/SprintPage.jsx';
import PollsPage from './pages/PollsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import ActivityLogPage from './pages/ActivityLogPage.jsx';
import CRMPage from './pages/CRMPage.jsx';
import TimeTrackingPage from './pages/TimeTrackingPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import InvoicesPage from './pages/InvoicesPage.jsx';
import DirectoryPage from './pages/DirectoryPage.jsx';
import AnnouncementsPage from './pages/AnnouncementsPage.jsx';
import OKRPage from './pages/OKRPage.jsx';
import RetroPage from './pages/RetroPage.jsx';
import BookmarksPage from './pages/BookmarksPage.jsx';
import ScratchpadPage from './pages/ScratchpadPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import PermissionsPage from './pages/PermissionsPage.jsx';
import EmailPage from './pages/EmailPage.jsx';
import ResourcePlannerPage from './pages/ResourcePlannerPage.jsx';
import HelpDeskPage from './pages/HelpDeskPage.jsx';
import PerformanceReviewsPage from './pages/PerformanceReviewsPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import AIAssistantPage from './pages/AIAssistantPage.jsx';
import IntegrationsPage from './pages/IntegrationsPage.jsx';
import ClientPortalPage from './pages/ClientPortalPage.jsx';
import AutomationsPage from './pages/AutomationsPage.jsx';
import ReportsBuilderPage from './pages/ReportsBuilderPage.jsx';
import MeetingNotesPage from './pages/MeetingNotesPage.jsx';
import RecruitmentPage from './pages/RecruitmentPage.jsx';
import LMSPage from './pages/LMSPage.jsx';
import ContractsPage from './pages/ContractsPage.jsx';
import NPSPage from './pages/NPSPage.jsx';
import DataExportPage from './pages/DataExportPage.jsx';
import DecisionLogPage from './pages/DecisionLogPage.jsx';
import VideoVoicemailPage from './pages/VideoVoicemailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import './styles/studio.css';

const APP_ROUTES = {
  chat: { component: ChatPage, label: 'Chat', icon: 'nf-fa-comments' },
  voice: { component: VoicePage, label: 'Voice', icon: 'nf-fa-microphone' },
  video: { component: VideoPage, label: 'Video', icon: 'nf-fa-video' },
  calls: { component: CallsPage, label: '1v1 Calls', icon: 'nf-fa-phone' },
  screenshare: { component: ScreenSharePage, label: 'Screen Share', icon: 'nf-fa-display' },
  tasks: { component: TasksPage, label: 'Tasks', icon: 'nf-fa-list_check' },
  files: { component: FilesPage, label: 'Files', icon: 'nf-fa-folder_open' },
  docs: { component: DocumentsPage, label: 'Documents', icon: 'nf-fa-file_lines' },
  whiteboard: { component: WhiteboardPage, label: 'Whiteboard', icon: 'nf-fa-pen_fancy' },
  calendar: { component: CalendarPage, label: 'Calendar', icon: 'nf-fa-calendar_days' },
  kanban: { component: KanbanPage, label: 'Kanban', icon: 'nf-fa-columns' },
  forms: { component: FormsPage, label: 'Forms', icon: 'nf-fa-list' },
  wiki: { component: WikiPage, label: 'Wiki', icon: 'nf-fa-book' },
  meetings: { component: MeetingsPage, label: 'Meetings', icon: 'nf-fa-notes_medical' },
  apiplayground: { component: APIPlaygroundPage, label: 'API Playground', icon: 'nf-fa-code' },
  timeline: { component: TimelinePage, label: 'Timeline', icon: 'nf-fa-chart_bar' },
  database: { component: DatabasePage, label: 'Database', icon: 'nf-fa-table' },
  mindmap: { component: MindMapPage, label: 'Mind Map', icon: 'nf-fa-diagram_project' },
  sprint: { component: SprintPage, label: 'Sprint', icon: 'nf-fa-sprint' },
  polls: { component: PollsPage, label: 'Polls', icon: 'nf-fa-chart_simple' },
  notifications: { component: NotificationsPage, label: 'Notifications', icon: 'nf-fa-bell' },
  activitylog: { component: ActivityLogPage, label: 'Activity Log', icon: 'nf-fa_timeline' },
  crm: { component: CRMPage, label: 'CRM', icon: 'nf-fa_address_book' },
  timetracking: { component: TimeTrackingPage, label: 'Time Tracking', icon: 'nf-fa-clock' },
  expenses: { component: ExpensesPage, label: 'Expenses', icon: 'nf-fa-money_bill' },
  invoices: { component: InvoicesPage, label: 'Invoices', icon: 'nf-fa-file_invoice' },
  directory: { component: DirectoryPage, label: 'Directory', icon: 'nf-fa-address_card' },
  announcements: { component: AnnouncementsPage, label: 'Announcements', icon: 'nf-fa-bullhorn' },
  okr: { component: OKRPage, label: 'OKR', icon: 'nf-fa-bullseye' },
  retro: { component: RetroPage, label: 'Retrospectives', icon: 'nf-fa-rotate_left' },
  bookmarks: { component: BookmarksPage, label: 'Bookmarks', icon: 'nf-fa-bookmark' },
  scratchpad: { component: ScratchpadPage, label: 'Scratchpad', icon: 'nf-fa-note_sticky' },
  analytics: { component: AnalyticsPage, label: 'Analytics', icon: 'nf-fa-chart_pie' },
  permissions: { component: PermissionsPage, label: 'Permissions', icon: 'nf-fa-shield' },
  email: { component: EmailPage, label: 'Email', icon: 'nf-fa-envelope' },
  resourceplanner: { component: ResourcePlannerPage, label: 'Resource Planner', icon: 'nf-fa-calendar_week' },
  helpdesk: { component: HelpDeskPage, label: 'Help Desk', icon: 'nf-fa-ticket' },
  performancereviews: { component: PerformanceReviewsPage, label: 'Performance', icon: 'nf-fa-star' },
  onboarding: { component: OnboardingPage, label: 'Onboarding', icon: 'nf-fa-clipboard_list' },
  search: { component: SearchPage, label: 'Search', icon: 'nf-fa-magnifying_glass' },
  aiassistant: { component: AIAssistantPage, label: 'AI Assistant', icon: 'nf-fa-robot' },
  integrations: { component: IntegrationsPage, label: 'Integrations', icon: 'nf-fa-plug' },
  clientportal: { component: ClientPortalPage, label: 'Client Portal', icon: 'nf-fa-globe' },
  automations: { component: AutomationsPage, label: 'Automations', icon: 'nf-fa-gears' },
  reportsbuilder: { component: ReportsBuilderPage, label: 'Reports', icon: 'nf-fa-chart_pie' },
  meetingnotes: { component: MeetingNotesPage, label: 'Meeting Notes', icon: 'nf-fa-notes_medical' },
  recruitment: { component: RecruitmentPage, label: 'Recruitment', icon: 'nf-fa-user_tie' },
  lms: { component: LMSPage, label: 'LMS', icon: 'nf-fa-graduation_cap' },
  contracts: { component: ContractsPage, label: 'Contracts', icon: 'nf-fa-file_signature' },
  nps: { component: NPSPage, label: 'NPS', icon: 'nf-fa-face_smile' },
  dataexport: { component: DataExportPage, label: 'Data Export', icon: 'nf-fa-download' },
  decisionlog: { component: DecisionLogPage, label: 'Decision Log', icon: 'nf-fa-scale_balanced' },
  videovoicemail: { component: VideoVoicemailPage, label: 'Video Voicemail', icon: 'nf-fa-video' },
};

function getRouteInfo() {
  const path = window.location.pathname.replace('/studio', '');
  if (path === '/login') return { route: 'login', params: {} };
  if (path === '' || path === '/') return { route: 'home', params: {} };

  const teamsMatch = path.match(/^\/teams\/(\d+)\/settings$/);
  if (teamsMatch) return { route: 'teamSettings', params: { teamId: parseInt(teamsMatch[1]) } };

  const appMatch = path.match(/^\/teams\/(\d+)\/(\w+)$/);
  if (appMatch && APP_ROUTES[appMatch[2]]) {
    return { route: 'app', params: { teamId: parseInt(appMatch[1]), appKey: appMatch[2] } };
  }

  const teamsMatch2 = path.match(/^\/teams\/(\d+)$/);
  if (teamsMatch2) return { route: 'teamHome', params: { teamId: parseInt(teamsMatch2[1]) } };

  return { route: 'home', params: {} };
}

import { navigateTo } from './utils/navigate.js';

function Router() {
  const { user, loading } = useAuth();
  const [routeInfo, setRouteInfo] = useState(getRouteInfo);
  const { route, params } = routeInfo;

  useEffect(() => {
    function handlePop() { setRouteInfo(getRouteInfo()); }
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const hasRedirected = useRef(false);
  useEffect(() => {
    if (!user && route !== 'login' && !loading && !hasRedirected.current) {
      hasRedirected.current = true;
      navigateTo('/login');
    }
    if (user) hasRedirected.current = false;
  }, [user, loading]);

  if (loading) {
    return (
      <div className="studio-loading">
        <div className="studio-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user && route !== 'login') return null;

  let content;
  if (route === 'login') {
    content = <LoginPage />;
  } else if (route === 'teamSettings') {
    content = <TeamSettings teamId={params.teamId} />;
  } else if (route === 'app' && APP_ROUTES[params.appKey]) {
    const AppComponent = APP_ROUTES[params.appKey].component;
    content = <AppComponent teamId={params.teamId} />;
  } else if (route === 'teamHome') {
    content = <TeamDashboard teamId={params.teamId} navigateTo={navigateTo} />;
  } else {
    content = <TeamsPage />;
  }

  return (
    <StudioLayout currentRoute={routeInfo} navigateTo={navigateTo}>
      {content}
    </StudioLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

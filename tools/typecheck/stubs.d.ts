/* PARTIAL TYPE-CHECK STUBS — used only because @types/react could not be installed in the sandbox.
   React APIs are typed loosely here, so this check covers the app's own types (data, services,
   selectors, component props) but NOT React's DOM attribute typings. `npm run typecheck` is the real check. */
declare module 'react' {
  export type ReactNode = any; export type ReactElement = any; export type FC<P = {}> = (p: P) => any;
  export type RefObject<T> = { current: T | null };
  type H = (e: any) => void;
  type Attrs = { [k: string]: any; className?: string; children?: any; id?: string; style?: any; disabled?: boolean; type?: string; ref?: any; onChange?: H; onClick?: H; onSubmit?: H; onKeyDown?: H; onMouseDown?: H; onDragOver?: H; onDragLeave?: H; onDrop?: H };
  export type IntrinsicAttrs = Attrs;
  export type HTMLAttributes<T> = Attrs; export type ButtonHTMLAttributes<T> = Attrs; export type InputHTMLAttributes<T> = Attrs;
  export type SelectHTMLAttributes<T> = Attrs; export type TextareaHTMLAttributes<T> = Attrs; export type AnchorHTMLAttributes<T> = Attrs;
  export type KeyboardEvent<T = Element> = globalThis.KeyboardEvent & { currentTarget: T };
  export function useState<S>(init: S | (() => S)): [S, (v: S | ((p: S) => S)) => void];
  export function useEffect(f: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(f: () => T, deps: unknown[]): T;
  export function useCallback<T>(f: T, deps: unknown[]): T;
  export function useRef<T>(init: T): { current: T };
  export function useRef<T>(init: null): { current: T | null };
  export function useId(): string;
  export function useSyncExternalStore<T>(sub: (cb: () => void) => () => void, get: () => T, server?: () => T): T;
  export function createContext<T>(v: T): { Provider: any; Consumer: any; _v?: T };
  export function useContext<T>(c: { _v?: T }): T;
  export function forwardRef<R, P>(f: (p: P, ref: any) => any): (p: P & { ref?: any }) => any;
  export const Children: { forEach(c: any, f: (x: any) => void): void };
  export function isValidElement(x: any): x is { type: any; props: any };
  export const Fragment: any; export const StrictMode: any;
  const React: { Fragment: any; forwardRef: typeof forwardRef }; export default React;
}
declare module 'react/jsx-runtime' {
  export namespace JSX { type Element = any; interface IntrinsicElements { [e: string]: import('react').IntrinsicAttrs } interface IntrinsicAttributes { key?: any } interface ElementChildrenAttribute { children: {} } }
  export const jsx: any; export const jsxs: any; export const Fragment: any;
}
declare module 'react-dom/client' { export function createRoot(el: Element): { render(x: any): void }; }
declare module 'react-icons/lu' {
  type IconType = (p: { [k: string]: any }) => any;
  export const LuArrowDown: IconType;
  export const LuArrowLeft: IconType;
  export const LuArrowRight: IconType;
  export const LuArrowUp: IconType;
  export const LuAward: IconType;
  export const LuBell: IconType;
  export const LuBookMarked: IconType;
  export const LuBookOpen: IconType;
  export const LuCalendar: IconType;
  export const LuCalendarCheck: IconType;
  export const LuCaptions: IconType;
  export const LuChartBar: IconType;
  export const LuChartLine: IconType;
  export const LuCheck: IconType;
  export const LuCheckCheck: IconType;
  export const LuChevronDown: IconType;
  export const LuChevronLeft: IconType;
  export const LuChevronRight: IconType;
  export const LuCircle: IconType;
  export const LuCircleAlert: IconType;
  export const LuCircleCheck: IconType;
  export const LuCircleDot: IconType;
  export const LuCircleHelp: IconType;
  export const LuCircleX: IconType;
  export const LuClipboardList: IconType;
  export const LuClock: IconType;
  export const LuCloudOff: IconType;
  export const LuCompass: IconType;
  export const LuCopy: IconType;
  export const LuCreditCard: IconType;
  export const LuDownload: IconType;
  export const LuEye: IconType;
  export const LuEyeOff: IconType;
  export const LuFileCheck: IconType;
  export const LuFileText: IconType;
  export const LuGraduationCap: IconType;
  export const LuGripVertical: IconType;
  export const LuHouse: IconType;
  export const LuInbox: IconType;
  export const LuInfo: IconType;
  export const LuLandmark: IconType;
  export const LuLayoutDashboard: IconType;
  export const LuLifeBuoy: IconType;
  export const LuListOrdered: IconType;
  export const LuLock: IconType;
  export const LuLogOut: IconType;
  export const LuMail: IconType;
  export const LuMailCheck: IconType;
  export const LuMaximize: IconType;
  export const LuMegaphone: IconType;
  export const LuMenu: IconType;
  export const LuMessageSquare: IconType;
  export const LuMinus: IconType;
  export const LuPause: IconType;
  export const LuPin: IconType;
  export const LuPlay: IconType;
  export const LuPlus: IconType;
  export const LuPrinter: IconType;
  export const LuReceipt: IconType;
  export const LuRefreshCw: IconType;
  export const LuSave: IconType;
  export const LuSearch: IconType;
  export const LuSearchX: IconType;
  export const LuSend: IconType;
  export const LuSettings: IconType;
  export const LuShieldCheck: IconType;
  export const LuShieldX: IconType;
  export const LuSignal: IconType;
  export const LuSlidersHorizontal: IconType;
  export const LuSmartphone: IconType;
  export const LuStar: IconType;
  export const LuThumbsDown: IconType;
  export const LuThumbsUp: IconType;
  export const LuTrash2: IconType;
  export const LuTriangleAlert: IconType;
  export const LuTrophy: IconType;
  export const LuUndo2: IconType;
  export const LuUpload: IconType;
  export const LuUser: IconType;
  export const LuUserCog: IconType;
  export const LuUsers: IconType;
  export const LuVideo: IconType;
  export const LuVideoOff: IconType;
  export const LuVolume2: IconType;
  export const LuWifiOff: IconType;
  export const LuX: IconType;
}
declare module '*.css';
declare module 'react-router-dom' {
  type Opts = { replace?: boolean; state?: unknown };
  export function HashRouter(p: { children: any }): any;
  export function Routes(p: { children: any }): any;
  export function Route(p: { path?: string; index?: boolean; element?: any; children?: any }): any;
  export function Outlet(): any;
  export function Link(p: { to: string; replace?: boolean; state?: unknown; className?: string; children?: any; onClick?: (e: any) => void; [k: string]: any }): any;
  export function NavLink(p: { to: string; end?: boolean; className?: string | ((s: { isActive: boolean }) => string); children?: any; onClick?: (e: any) => void; [k: string]: any }): any;
  export function Navigate(p: { to: string; replace?: boolean }): any;
  export function useNavigate(): (to: string | number, o?: Opts) => void;
  export function useParams<T = Record<string, string | undefined>>(): T;
  export function useLocation(): { pathname: string; search: string; hash: string; state?: unknown };
  export function useSearchParams(): [URLSearchParams, (n: URLSearchParams | Record<string, string> | ((p: URLSearchParams) => URLSearchParams), o?: Opts) => void];
}

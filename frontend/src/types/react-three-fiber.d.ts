// Type definitions for React Three Fiber
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      color: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ambientLight: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      group: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mesh: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [elemName: string]: any;
    }
  }
}

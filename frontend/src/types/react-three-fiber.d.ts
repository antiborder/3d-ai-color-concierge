// Type definitions for React Three Fiber
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      color: any;
      ambientLight: any;
      group: any;
      mesh: any;
      [elemName: string]: any;
    }
  }
}

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8 border border-white/5 rounded-2xl text-center">
          <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase font-bold mb-2">
            3D Canvas Offline
          </span>
          <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">
            Your browser or device has disabled WebGL. The 2D control panels remain fully active.
          </p>
          <span className="text-[9px] text-slate-650 font-mono mt-3 opacity-50 block">
            Err: {this.state.error?.message || 'Context creation failed'}
          </span>
        </div>
      );
    }

    return this.props.children;
  }
}

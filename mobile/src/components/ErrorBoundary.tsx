import React from 'react';

export default class ErrorBoundary extends React.Component<{children: React.ReactNode}, {erro: string|null}> {
  state = { erro: null as string|null };
  static getDerivedStateFromError(e: any){ return { erro: String(e?.message||e) }; }
  componentDidCatch(e:any, info:any){ console.error('[ErrorBoundary]', e, info); }
  render(){
    if(this.state.erro){
      return (
        <div className="min-h-screen grid place-items-center p-6 bg-zinc-50">
          <div className="bg-white border rounded-2xl p-4 max-w-sm w-full space-y-2">
            <h1 className="font-bold text-rose-600">Erro no app</h1>
            <pre className="text-xs bg-zinc-100 p-2 rounded-xl whitespace-pre-wrap break-all">{this.state.erro}</pre>
            <button onClick={()=> this.setState({erro:null})} className="w-full bg-zinc-900 text-white rounded-xl py-2 text-sm">Tentar novamente</button>
            <p className="text-[11px] text-zinc-500">Se persistir, limpe dados do app ou reinstale.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

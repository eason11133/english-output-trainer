import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/** Web previews use the same mobile canvas sizing semantics as native Yoga. */
export default function Root({children}:PropsWithChildren){return <html lang="zh-Hant"><head><meta charSet="utf-8"/><meta httpEquiv="X-UA-Compatible" content="IE=edge"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"/><ScrollViewStyleReset/><style dangerouslySetInnerHTML={{__html:'*,*::before,*::after{box-sizing:border-box}html,body,#root{width:100%;min-height:100%;margin:0;overflow-x:hidden}'}}/></head><body>{children}</body></html>}

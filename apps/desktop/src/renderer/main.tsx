import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

loader.config({ monaco });

const root = document.querySelector('#root');
if (!root) throw new Error('Elemento raiz não encontrado.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

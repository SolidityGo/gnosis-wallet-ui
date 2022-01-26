import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.less';
import { Gnosis } from './views/Gnosis';

const App: React.FC = () => {
  return (
    <div className="App">
      <div>
        <Routes>
          <Route index element={<Gnosis />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;

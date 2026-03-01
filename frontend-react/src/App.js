import React from "react";
import "./App.css";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { AssistantThread } from "./AssistantThread";

function App() {
  return (
    <div className="app">
      <MyRuntimeProvider>
        <AssistantThread />
      </MyRuntimeProvider>
    </div>
  );
}

export default App;

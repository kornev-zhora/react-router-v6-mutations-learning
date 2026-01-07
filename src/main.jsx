import * as React from "react";
import * as ReactDOM from "react-dom/client";
import ErrorPage from "./error-page";
import Index from "./routes/index";
import {action as destroyAction} from "./routes/destroy";
import Contact, {
    loader as contactLoader,
    action as contactAction,
} from "./routes/contact";
import EditContact, {
    action as editAction,
} from "./routes/edit";


import Root, {
    loader as rootLoader, action as rootAction,
} from "./routes/root";

import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import "./index.css";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        errorElement: <ErrorPage/>,
        loader: rootLoader,
        action: rootAction,
        children: [{
            errorElement: <ErrorPage/>,
            children: [
                {
                    path: "contacts/:contactId",
                    element: <Contact/>,
                    loader: contactLoader,
                    action: contactAction,
                },
                {
                    path: "contacts/:contactId/edit",
                    element: <EditContact/>,
                    loader: contactLoader,
                    action: editAction,
                },
                {
                    path: "contacts/:contactId/destroy",
                    action: destroyAction,
                },
                {index: true, element: <Index/>},
            ]
        }
        ],

    },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>
);

package com.trufun.webrcp.rcp.demo.client;

import org.eclipse.jface.action.Action;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.jface.resource.ImageDescriptor;
import org.eclipse.ui.IWorkbenchWindow;


public class MessagePopupAction extends Action {

    private final IWorkbenchWindow window;

    MessagePopupAction(String text, IWorkbenchWindow window) {
        super(text);
        this.window = window;
        // The id is used to refer to the action in a menu or toolbar
        setId("CMD_OPEN_MESSAGE");
        // Associate the action with a pre-defined command, to allow key bindings.
//        setActionDefinitionId(ICommandIds.CMD_OPEN_MESSAGE);
        setImageDescriptor(ImageDescriptor.createFromFile(null,"/icons/sample3.gif"));
    }

    public void run() {
        MessageDialog.openInformation(window.getShell(), "Open", "Open Message Dialog!");
    }
}
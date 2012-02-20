package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.*;
import org.eclipse.swt.graphics.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.swt.layout.*;

public class Snippet65 {

	public static void main(String[] args) {
		Display display = new Display();
		final Shell shell = new Shell(display);
		Label label = new Label(shell, SWT.WRAP);
		label.setText("This is a long text string that will wrap when the dialog is resized.");
		List list = new List(shell, SWT.BORDER | SWT.H_SCROLL | SWT.V_SCROLL);
		list.setItems(new String[] { "Item 1", "Item 2" });
		Button button1 = new Button(shell, SWT.PUSH);
		button1.setText("OK");
		Button button2 = new Button(shell, SWT.PUSH);
		button2.setText("Cancel");

		final int insetX = 4, insetY = 4;
		FormLayout formLayout = new FormLayout();
		formLayout.marginWidth = insetX;
		formLayout.marginHeight = insetY;
		shell.setLayout(formLayout);

		Point size = label.computeSize(SWT.DEFAULT, SWT.DEFAULT);
		final FormData labelData = new FormData(size.x, SWT.DEFAULT);
		labelData.left = new FormAttachment(0, 0);
		labelData.right = new FormAttachment(100, 0);
		label.setLayoutData(labelData);
		shell.addListener(SWT.Resize, new Listener() {
			public void handleEvent(Event e) {
				Rectangle rect = shell.getClientArea();
				labelData.width = rect.width - insetX * 2;
				shell.layout();
			}
		});

		FormData button2Data = new FormData();
		button2Data.right = new FormAttachment(100, -insetX);
		button2Data.bottom = new FormAttachment(100, 0);
		button2.setLayoutData(button2Data);

		FormData button1Data = new FormData();
		button1Data.right = new FormAttachment(button2, -insetX);
		button1Data.bottom = new FormAttachment(100, 0);
		button1.setLayoutData(button1Data);

		FormData listData = new FormData();
		listData.left = new FormAttachment(0, 0);
		listData.right = new FormAttachment(100, 0);
		listData.top = new FormAttachment(label, insetY);
		listData.bottom = new FormAttachment(button2, -insetY);
		list.setLayoutData(listData);

		// shell.pack ();
		shell.setSize(400, 300);
		// shell.setLocation(100, 30);
		shell.open();
		// while (!shell.isDisposed ()) {
		// if (!display.readAndDispatch ()) display.sleep ();
		// }
		// display.dispose ();
	}
}
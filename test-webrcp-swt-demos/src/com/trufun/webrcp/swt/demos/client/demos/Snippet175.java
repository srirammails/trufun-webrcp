package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.*;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;

/*
 * Exclude a widget from a GridLayout
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 * 
 * @since 3.1
 */

public class Snippet175 {

	public static void main(String[] args) {

		Display display = new Display();
		final Shell shell = new Shell(display);
		shell.setLayout(new GridLayout(3, false));

		Button b = new Button(shell, SWT.PUSH);
		b.setText("Button 0");

		final Button bHidden = new Button(shell, SWT.PUSH);
		bHidden.setText("Button 1");
		GridData data = new GridData();
		data.exclude = true;
		data.horizontalSpan = 2;
		data.horizontalAlignment = SWT.FILL;
		bHidden.setLayoutData(data);

		b = new Button(shell, SWT.PUSH);
		b.setText("Button 2");
		b = new Button(shell, SWT.PUSH);
		b.setText("Button 3");
		b = new Button(shell, SWT.PUSH);
		b.setText("Button 4");

		b = new Button(shell, SWT.CHECK);
		b.setText("hide");
		b.addListener(SWT.Selection, new Listener() {
			public void handleEvent(Event e) {
				Button b = (Button) e.widget;
				GridData data = (GridData) bHidden.getLayoutData();
				data.exclude = b.getSelection();
				bHidden.setVisible(!data.exclude);
				shell.layout(false);
			}
		});
		b.setSelection(true);
		shell.setSize(400, 400);
		shell.open();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch())
		// display.sleep();
		// }
		// display.dispose();
	}
}
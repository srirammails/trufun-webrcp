package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.SWT;
import org.eclipse.swt.custom.StackLayout;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.events.SelectionListener;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;

public class StackLayoutControlMargin {
	public static void main(String[] args) {
		Display display = new Display();
		final Shell shell = new Shell(display);
		final StackLayout stackLayout = new StackLayout();
		stackLayout.marginHeight = 20;
		stackLayout.marginWidth = 20;
		shell.setLayout(stackLayout);
		final Button[] buttons = new Button[3];
		for (int i = 0; i < buttons.length; i++) {
			buttons[i] = new Button(shell, SWT.NULL);
			buttons[i].setText("Button #" + i);
			buttons[i].addSelectionListener(new SelectionListener() {
				public void widgetSelected(SelectionEvent e) {
					// Flip to next button.
					Button nextButton = null;
					for (int i = 0; i < buttons.length; i++) {
						if (buttons[i] == e.widget) {
							if (i == buttons.length - 1)
								nextButton = buttons[0];
							else
								nextButton = buttons[i + 1];
						}
					}
					stackLayout.topControl = nextButton;
					shell.layout();
				}

				public void widgetDefaultSelected(SelectionEvent e) {
				}
			});
		}
		stackLayout.topControl = buttons[0];
		shell.setSize(450, 400);
		shell.open();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch()) {
		// display.sleep();
		// }
		// }
		// display.dispose();
	}
}

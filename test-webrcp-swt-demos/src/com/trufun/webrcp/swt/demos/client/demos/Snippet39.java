package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.*;
import org.eclipse.swt.custom.*;
import org.eclipse.swt.events.*;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;

public class Snippet39 {
	public static void main(String[] args) {
		Display display = new Display();
		Shell shell = new Shell(display);
		shell.setLayout(new GridLayout());

		CCombo combo = new CCombo(shell, SWT.FLAT | SWT.BORDER);// SWT.READ_ONLY
																// |
		combo.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
		for (int i = 0; i < 5; i++) {
			combo.add("item" + i);
		}
		combo.setText("item0");

		combo.addSelectionListener(new SelectionAdapter() {
			public void widgetSelected(SelectionEvent e) {
				System.out.println("Item selected");
			};
		});

		shell.pack();
		shell.open();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch()) display.sleep();
		// }
		// display.dispose();
	}
}

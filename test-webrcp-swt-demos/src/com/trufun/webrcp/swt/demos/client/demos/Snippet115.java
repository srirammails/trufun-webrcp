package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.swt.layout.*;

public class Snippet115 {

	public static void main(String[] args) {
		Display display = new Display();
		Shell shell = new Shell(display);
		shell.setLayout(new RowLayout(SWT.VERTICAL));
		Composite c1 = new Composite(shell, SWT.BORDER | SWT.NO_RADIO_GROUP);
		c1.setLayout(new RowLayout());
		Composite c2 = new Composite(shell, SWT.BORDER | SWT.NO_RADIO_GROUP);
		c2.setLayout(new RowLayout());
		final Composite[] composites = new Composite[] { c1, c2 };
		Listener radioGroup = new Listener() {
			public void handleEvent(Event event) {
				for (int i = 0; i < composites.length; i++) {
					Composite composite = composites[i];
					Control[] children = composite.getChildren();
					for (int j = 0; j < children.length; j++) {
						Control child = children[j];
						if (child instanceof Button) {
							Button button = (Button) child;
							if ((button.getStyle() & SWT.RADIO) != 0)
								if (!button.equals(event.widget))
									button.setSelection(false);
						}
					}
				}
				Button button = (Button) event.widget;
				button.setSelection(true);
			}
		};
		for (int i = 0; i < 4; i++) {
			Button button = new Button(c1, SWT.RADIO);
			button.setText("Button " + i);
			button.addListener(SWT.Selection, radioGroup);
		}
		for (int i = 0; i < 4; i++) {
			Button button = new Button(c2, SWT.RADIO);
			button.setText("Button " + (i + 4));
			button.addListener(SWT.Selection, radioGroup);
		}
		shell.pack();
		shell.open();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch ()) display.sleep ();
		// }
		// display.dispose ();
	}
}

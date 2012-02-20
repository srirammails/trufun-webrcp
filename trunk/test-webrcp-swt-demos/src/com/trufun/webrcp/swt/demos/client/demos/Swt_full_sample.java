package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.SWT;
import org.eclipse.swt.graphics.RGB;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.ColorDialog;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.MessageBox;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.adpater.ParameterRunnable;
import org.eclipse.swt.widgets.adpater.qx.app.SWTApp;

import com.google.gwt.user.client.Window;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class Swt_full_sample {//extends SWTApp {// implements EntryPoint {

	public void run() {
		Display display = new Display();
		final Shell shell = new Shell(display);

		shell.setLocation(100, 100);

		shell.setLayout(new GridLayout(6, true));
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Coolbar");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet150.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("CLabel");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					CLabelBorder.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("CCombo");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet39.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("ExpandBar");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet223.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		// {
		// Button button = new Button (shell, SWT.PUSH);
		// button.setText ("Scale");
		// button.addListener (SWT.Selection, new Listener () {
		// public void handleEvent (Event e) {
		// Snippet45.main(null);
		// }
		// });
		// }
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Slider");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet17.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Spinner");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet190.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("ProgressBar");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet57.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("List");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet59.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Combo");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet24.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			// show only column row 1 error: table.getTopIndex == 0 ?
			Button button = new Button(shell, SWT.PUSH);
			button.setText("TableEditor");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet124.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Table1");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet103.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("TreeEditor");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet111.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("TreeColumn");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet170.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Tree*");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Tree2.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Tree2");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet15.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Tree1");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet102.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("ToolBar-Control");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet58.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("ToolBar1");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet18.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Link");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet183.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Label");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet34.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("ColorDialog");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					ColorDialog dlg = new ColorDialog(shell);
					dlg.open(new ParameterRunnable() {

						@Override
						public void run() {
							// TODO Auto-generated method stub

						}

						@Override
						public void run(Object para) {
							RGB rgb = (RGB) para;
							Window.alert(rgb.toString());

						}
					});
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("MessageBox");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					MessageBox dlg = new MessageBox(shell, SWT.ICON_QUESTION
							| SWT.YES | SWT.NO);
					dlg.setMessage("Do you really want to exit?");
					dlg.setText("Exiting Application");
					dlg.open(new ParameterRunnable() {

						@Override
						public void run() {
							// TODO Auto-generated method stub

						}

						@Override
						public void run(Object para) {
							int code = (Integer) para;
							if (code == SWT.YES)
								Window.alert("Choosed Yes");
							if (code == SWT.NO)
								Window.alert("Choosed No");

						}
					});
				}
			});
		}
		// {
		// //not show error
		// Button button = new Button (shell, SWT.PUSH);
		// button.setText ("Label2");
		// button.addListener (SWT.Selection, new Listener () {
		// public void handleEvent (Event e) {
		// Snippet37.main(null);
		// }
		// });
		// }
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("SashForm");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet109.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("List");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet59.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("TabFolder");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet76.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Sash1");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet107.main(null);
				}
			});
		}

		// {
		// //error
		// Button button = new Button (shell, SWT.PUSH);
		// button.setText ("Sash2");
		// button.addListener (SWT.Selection, new Listener () {
		// public void handleEvent (Event e) {
		// Snippet54.main(null);
		// }
		// });
		// }
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Group");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet112.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("CTabFolder");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet165.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("CTabFolder2");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet82.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Popup Menu");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet238.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Popup Menu2");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet131.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("menubar");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet29.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("image button");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet206.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("toggle button");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet169.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("row layout");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet108.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("stack layout");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					StackLayoutControlMargin.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("canvas drawImage");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet48.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Canvas draw");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet245.main(null);
				}
			});
		}
		// {
		// //drag shell title error
		// Button button = new Button (shell, SWT.PUSH);
		// button.setText ("ScrolledComposite2");
		// button.addListener (SWT.Selection, new Listener () {
		// public void handleEvent (Event e) {
		// Snippet5.main(null);
		// }
		// });
		// }
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Mouse event");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet46.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Canvas backgroud");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					try {
						Snippet21.main(null);
					} catch (Exception e1) {

						e1.printStackTrace();
					}
				}
			});
		}
		// {
		// //horizatal drag error
		// Button button = new Button (shell, SWT.PUSH);
		// button.setText ("ScrolledComposite1");
		// button.addListener (SWT.Selection, new Listener () {
		// public void handleEvent (Event e) {
		// Snippet167.main(null);
		// }
		// });
		// }
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("radio button");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet115.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("radion button2");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet175.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("dialog");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet295.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("form layout");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet65.main(null);
				}
			});
		}
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("grid layout");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Snippet172.main(null);
				}
			});
		}

		shell.pack();
		shell.open();
	}

}

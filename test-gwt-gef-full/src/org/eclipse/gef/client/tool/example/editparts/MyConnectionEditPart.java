package org.eclipse.gef.client.tool.example.editparts;

import org.eclipse.draw2d.ColorConstants;
import org.eclipse.draw2d.IFigure;
import org.eclipse.draw2d.PolygonDecoration;
import org.eclipse.draw2d.PolylineConnection;
import org.eclipse.draw2d.geometry.PointList;
import org.eclipse.gef.editparts.AbstractConnectionEditPart;

public class MyConnectionEditPart extends AbstractConnectionEditPart {

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.gef.editparts.AbstractEditPart#createEditPolicies()
	 */
	protected void createEditPolicies() {
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.gef.editparts.AbstractGraphicalEditPart#createFigure()
	 */
	protected IFigure createFigure() {
		PolylineConnection connection = new PolylineConnection();
		PolygonDecoration decoration = new PolygonDecoration();

		// �R�l�N�V�����ɕH�`��ǉ�
		PointList pointList = new PointList();
		pointList.addPoint(0, 0);
		pointList.addPoint(-2, 2);
		pointList.addPoint(-4, 0);
		pointList.addPoint(-2, -2);
		decoration.setTemplate(pointList);

		decoration.setBackgroundColor(ColorConstants.white);
		decoration.setOpaque(true);

		connection.setTargetDecoration(decoration);
		return connection;

	}

}

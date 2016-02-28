import React from 'react';

class TestReactClass extends React.Component {

	render() {
		return (
				<div className='test'>
					<div className='test-exist' key='jdj'></div>
					<div className='test-with space'></div>
					<div id='id-number-1'></div>
				</div>
		);
	}

}

export default TestReactClass;

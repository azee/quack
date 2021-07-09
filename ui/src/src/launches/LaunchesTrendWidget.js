import React from 'react';
import SubComponent from '../common/SubComponent'
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import Highcharts from 'highcharts';
import Backend from '../services/backend';

class LaunchesTrendWidget extends SubComponent {

    state = {
        launches: [],
        filter: {
            skip: 0,
            limit: 20,
            orderby: "id",
            orderdir: "DESC",
            includedFields: "launchStats,createdTime"
        },
        loading: true
    };

    constructor(props) {
        super(props);
        this.getLaunches = this.getLaunches.bind(this);
        this.renderChart = this.renderChart.bind(this);
        this.getSeries = this.getSeries.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.projectId){
            this.state.projectId = nextProps.projectId;
        }
        if (nextProps.filter){
            this.state.filter = nextProps.filter;
        }
        this.getLaunches();
    }

    componentDidMount() {
        super.componentDidMount();
        this.getLaunches();
    }

    getLaunches(){
        if (!this.state.projectId){
            return [];
        }
       Backend.get(this.state.projectId + "/launch?" + Utils.filterToQuery(this.state.filter))
            .then(response => {
                 this.state.launches = response.data.reverse();
                 this.state.loading = false;
                 this.renderChart();
                 this.setState(this.state);
        }).catch(error => {
            Utils.onErrorMessage("Couldn't get launches: ", error);
            this.state.loading = false;
            this.setState(this.state);
        });
    }


    renderChart(){
        Highcharts.chart('trend', {

            title: {
                text: 'Launches Statuses Trend'
            },

            yAxis: {
                title: {
                    text: 'TestCases'
                }
            },

            xAxis: {
                categories: this.state.launches.map(launch => Utils.timeToDateNoTime(launch.createdTime))
            },

            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },

            plotOptions: {
                series: {
                    label: {
                        connectorAllowed: false
                    }
                }
            },
            series: this.getSeries(),
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }
        });
    }

    getSeries(){
        var totalStats = {
            'PASSED': {name: 'Passed', color: '#28a745', data: []},
            'FAILED': {name: 'Failed', color: '#dc3545', data: []},
            'BROKEN': {name: 'Broken', color: '#ffc107', data: []},
            'SKIPPED': {name: 'Skipped', color: '#6c757d', data: []},
            'TOTAL': {name: 'Total', color: '#007bff', data: []}
        };

        this.state.launches.forEach(launch => {
            Object.keys(launch.launchStats.statusCounters).forEach(key => {
                if (totalStats[key]){
                    totalStats[key].data.push(launch.launchStats.statusCounters[key]);
                }
            })
            totalStats['TOTAL'].data.push(launch.launchStats.total);
        })

        return Object.keys(totalStats).map(key => totalStats[key]);
    }

    render() {
        return (
            <div>
                <div id="trend"></div>
                <div id='sweet-loading'>
                     <FadeLoader
                       sizeUnit={"px"}
                       size={100}
                       color={'#135f38'}
                       loading={this.state.loading}
                     />
                </div>
            </div>

        );
      }

}

export default LaunchesTrendWidget;
